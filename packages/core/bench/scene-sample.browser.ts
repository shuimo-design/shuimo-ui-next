/** 远山第三版样张：旧站整幅 vs 新版整幅 vs 现版组件。BENCH=1 vp test bench/scene-sample */
import { it } from "vitest";
import { commands } from "vitest/browser";
import { inkRidgeUrl } from "../src/ink";
import { inkMountainScene } from "../src/ink/assets/mountain";

const PAPER = "#f4efe3";
/** 旧图量出来的颜色：线 (16,24,22)，青绿山体 (60,85,78) */
const INK = "#101816";
const WASH = "#35564d";
/** 前景两座山的颜料：比青绿深一档的灰绿，旧图量出来 ≈ (59,69,66) */
const FRONT = "#34433f";
const OLD_COLOR = "#6b6f74";

async function tint(url: string, w: number, h: number, color: string): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

/** 旧站布局（4096 单位）：左组 x -55 宽 1772，右组右沿 4096+55 宽 2273，两组底都在 773 */
const SCENE_W = 4096;
const SCENE_H = 773;
const GROUPS = {
  left: { x: -55, w: 1772 },
  right: { x: SCENE_W + 55 - 2273, w: 2273 },
} as const;

/** 画一整幅新版：x0,y0 是画幅左上角，pw 是画幅宽 */
async function drawScene(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  pw: number,
  seed: number,
  S: number,
  only?: "left" | "right",
) {
  const k = pw / SCENE_W;
  for (const side of ["left", "right"] as const) {
    if (only && only !== side) continue;
    const g = GROUPS[side];
    const scene = inkMountainScene({ seed, side });
    const w = g.w * k;
    const h = (g.w / scene.width) * scene.height * k;
    const x = x0 + g.x * k;
    const y = y0 + SCENE_H * k - h;
    for (const layer of scene.layers) {
      ctx.globalAlpha = 1;
      ctx.drawImage(await tint(layer.silhouette, w * S, h * S, PAPER), x, y, w, h);
      ctx.drawImage(
        await tint(layer.wash, w * S, h * S, layer.role === "ink" ? FRONT : WASH),
        x,
        y,
        w,
        h,
      );
      ctx.drawImage(await tint(layer.line, w * S, h * S, INK), x, y, w, h);
      ctx.drawImage(await tint(layer.mist, w * S, h * S, PAPER), x, y, w, h);
    }
  }
}

let oldImg: HTMLImageElement | null = null;
async function drawOld(ctx: CanvasRenderingContext2D, x0: number, y0: number, pw: number) {
  if (!oldImg) {
    oldImg = new Image();
    oldImg.src = "/bench/results/old-layout.png";
    await oldImg.decode();
  }
  const k = pw / SCENE_W;
  ctx.drawImage(oldImg, x0 - 60 * k, y0, oldImg.naturalWidth * k, oldImg.naturalHeight * k);
}

/** 现版组件的四张图（和 MRicePaper 的 RIDGES 一致） */
const SPECS = [
  { side: "left", width: 46, inset: -2, ratio: 3, range: [0, 0.45], opacity: 0.85, soft: false },
  { side: "left", width: 30, inset: 5, ratio: 2.3, range: [0.6, 1], opacity: 1, soft: true },
  { side: "right", width: 56, inset: -2, ratio: 2.9, range: [0, 0.45], opacity: 0.85, soft: false },
  { side: "right", width: 32, inset: 6, ratio: 2.4, range: [0.6, 1], opacity: 1, soft: true },
] as const;
async function drawCurrent(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  W: number,
  H: number,
  seed: number,
  S: number,
) {
  for (const [index, spec] of SPECS.entries()) {
    const w = (W * spec.width) / 100;
    const h = w / spec.ratio;
    const x =
      spec.side === "left" ? x0 + (W * spec.inset) / 100 : x0 + W - w - (W * spec.inset) / 100;
    const y = y0 + H - h;
    const r = inkRidgeUrl({
      seed: seed + index + 1,
      width: 1600,
      height: Math.round(1600 / spec.ratio),
      layers: 2,
      side: spec.side,
      depthRange: [spec.range[0], spec.range[1]],
      softOuter: spec.soft,
      opacity: spec.opacity,
      crest: true,
    });
    ctx.globalAlpha = 0.55;
    ctx.drawImage(await tint(r.silhouette, w * S, h * S, PAPER), x, y, w, h);
    ctx.drawImage(await tint(r.url, w * S, h * S, OLD_COLOR), x, y, w, h);
    ctx.globalAlpha = 1;
  }
}

it("dump scene sheet", async () => {
  const S = 2;
  const W = 1400;
  const pw = W - 20;
  const ph = Math.round((pw * SCENE_H) / SCENE_W);
  const zoomH = 330;
  const H = 3 * (ph + 34) + 34 + 260 + 2 * (zoomH + 34) + 20;
  const canvas = document.createElement("canvas");
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(S, S);
  ctx.fillStyle = "#ddd";
  ctx.fillRect(0, 0, W, H);
  ctx.font = "13px sans-serif";

  const label = (t: string, y: number) => {
    ctx.fillStyle = "#333";
    ctx.fillText(t, 10, y + 14);
  };
  const paper = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(x, y, w, h);
  };
  const clip = async (x: number, y: number, w: number, h: number, fn: () => Promise<void>) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    await fn();
    ctx.restore();
  };

  let y = 10;
  label("旧站 shuimo-ui 0.3：八张手绘 webp 按旧站 CSS 摆好 · 不透明", y);
  y += 24;
  paper(10, y, pw, ph);
  await clip(10, y, pw, ph, () => drawOld(ctx, 10, y, pw));
  y += ph + 10;

  for (const seed of [3, 7]) {
    label(`新版 seed ${seed} · 不透明（同样的布局：左右各四层 base / mid / front / front-2）`, y);
    y += 24;
    paper(10, y, pw, ph);
    await clip(10, y, pw, ph, () => drawScene(ctx, 10, y, pw, seed, S));
    y += ph + 10;
  }

  label(
    "落到页面上：左 旧站 × 0.3   中 新版 seed 3 × 0.3   右 现版组件（ridge.ts crest）× 0.55",
    y,
  );
  y += 24;
  {
    const cw = (pw - 20) / 3;
    const ch = 236;
    const tmp = document.createElement("canvas");
    tmp.width = cw * S;
    tmp.height = ch * S;
    const tctx = tmp.getContext("2d")!;
    tctx.scale(S, S);
    tctx.fillStyle = PAPER;
    tctx.fillRect(0, 0, cw, ch);
    await drawOld(tctx, 0, ch - (cw * SCENE_H) / SCENE_W, cw);
    paper(10, y, cw, ch);
    ctx.globalAlpha = 0.3;
    // 旧站的 webp 已经画在纸上了，只叠山的部分：先画纸再以 0.3 叠整块（纸叠纸不变色）
    ctx.drawImage(tmp, 10, y, cw, ch);
    ctx.globalAlpha = 1;

    tctx.fillStyle = PAPER;
    tctx.fillRect(0, 0, cw, ch);
    await drawScene(tctx, 0, ch - (cw * SCENE_H) / SCENE_W, cw, 3, S);
    paper(20 + cw, y, cw, ch);
    ctx.globalAlpha = 0.3;
    ctx.drawImage(tmp, 20 + cw, y, cw, ch);
    ctx.globalAlpha = 1;

    paper(30 + 2 * cw, y, cw, ch);
    await clip(30 + 2 * cw, y, cw, ch, () => drawCurrent(ctx, 30 + 2 * cw, y, cw, ch, 3, S));
    y += ch + 10;
  }

  for (const side of ["left", "right"] as const) {
    label(`放大对比 ${side === "left" ? "左" : "右"}组：左 旧站   右 新版 seed 3`, y);
    y += 24;
    const cw = (pw - 10) / 2;
    const g = GROUPS[side];
    // 把这一组放大到面板宽：画幅宽 = 面板宽 × 4096 / 组宽
    const spw = (cw * SCENE_W) / g.w;
    const dx = side === "left" ? -g.x * (spw / SCENE_W) : -(g.x * (spw / SCENE_W));
    const sph = (spw * SCENE_H) / SCENE_W;
    paper(10, y, cw, zoomH);
    await clip(10, y, cw, zoomH, () => drawOld(ctx, 10 + dx, y + zoomH - sph, spw));
    paper(20 + cw, y, cw, zoomH);
    await clip(20 + cw, y, cw, zoomH, () =>
      drawScene(ctx, 20 + cw + dx, y + zoomH - sph, spw, 3, S, side),
    );
    y += zoomH + 10;
  }

  await commands.writeFile(
    "bench/results/scene.png.b64",
    canvas.toDataURL("image/png").split(",")[1]!,
  );
});
