/** 把六类水墨素材渲染成一张总样张落盘，供人眼检查：BENCH=1 vp test bench/assets-sample */
import { it } from "vitest";
import { commands } from "vitest/browser";
import { brushLineUrl } from "../src/ink/assets/line";
import { inkMarkUrl, type InkMarkKind } from "../src/ink/assets/mark";
import { inkBlobUrl } from "../src/ink/assets/blob";
import { inkShapeUrl } from "../src/ink/assets/shape";
import { inkWashUrl } from "../src/ink/assets/wash";
import { inkRidgeUrl } from "../src/ink/assets/ridge";
import { inkCursorUrl } from "../src/ink/assets/cursor";

async function drawRaw(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const img = new Image();
  img.src = url;
  await img.decode();
  ctx.drawImage(img, x, y, w, h);
}

/** 素材本身只有黑和透明；这里像组件那样透过遮罩上色，颜色取 tokens 里的语义色 / 传统色 */
const INK = "#2b333e";
const ACCENT = "#861717";
const SUCCESS = "#4a9992";
const HUAQING = "#1a2847";
const QINGDAI = "#45465e";
const SONGLAN = "#6b798e";

async function draw(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color = INK,
) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const tmp = document.createElement("canvas");
  const S = 2;
  tmp.width = Math.max(1, Math.round(w * S));
  tmp.height = Math.max(1, Math.round(h * S));
  const tctx = tmp.getContext("2d")!;
  tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = color;
  tctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.drawImage(tmp, x, y, w, h);
}

it("dump ink asset sheet", async () => {
  const S = 2;
  const W = 900;
  const H = 740;
  const canvas = document.createElement("canvas");
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(S, S);
  ctx.fillStyle = "#f7f4ec";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#555";
  ctx.font = "12px sans-serif";
  const label = (t: string, x: number, y: number) => ctx.fillText(t, x, y);

  // 1 lines
  label("1 brush lines: divider (ink) / focus underline (accent) / v (songlan)", 20, 24);
  const h1 = brushLineUrl({ seed: 3, thickness: 3 });
  await draw(ctx, h1.url, 20, 32, 400, h1.height);
  const h2 = brushLineUrl({ seed: 5, thickness: 1.6, flyingWhite: 0.05 });
  await draw(ctx, h2.url, 20, 52, 300, h2.height, ACCENT);
  const v1 = brushLineUrl({ seed: 4, thickness: 3, vertical: true, length: 120 });
  await draw(ctx, v1.url, 440, 30, v1.width, 90, SONGLAN);

  // 2 marks
  label("2 marks @24 / @48", 20, 150);
  const kinds: InkMarkKind[] = [
    "check",
    "minus",
    "plus",
    "cross",
    "chevronDown",
    "chevronRight",
    "dot",
  ];
  const markColors = [INK, INK, ACCENT, ACCENT, INK, INK, ACCENT];
  for (const [i, k] of kinds.entries()) {
    await draw(ctx, inkMarkUrl(k, { seed: 2 }), 20 + i * 34, 160, 24, 24, markColors[i]);
    await draw(ctx, inkMarkUrl(k, { seed: 2 }), 280 + i * 56, 150, 48, 48, markColors[i]);
  }

  // 3 blobs
  label("3 blobs: 12 / 20 / 40 / 56 ragged", 20, 230);
  await draw(ctx, inkBlobUrl({ seed: 1, size: 12 }), 20, 240, 12, 12, ACCENT);
  await draw(ctx, inkBlobUrl({ seed: 2, size: 20 }), 44, 236, 20, 20);
  await draw(ctx, inkBlobUrl({ seed: 3, size: 40 }), 80, 226, 40, 40, HUAQING);
  await draw(ctx, inkBlobUrl({ seed: 4, size: 56, raggedness: 0.2 }), 136, 218, 56, 56, SUCCESS);

  // 4 shapes (masks) — paint colored through mask by drawing onto temp canvas
  label("4 shapes: tag 120x28 / button 100x36 / taper 160x32 / avatar 56", 20, 300);
  const paintShape = async (
    w: number,
    h: number,
    x: number,
    y: number,
    color: string,
    opts: Parameters<typeof inkShapeUrl>[2],
  ) => {
    const shape = inkShapeUrl(w, h, opts);
    await draw(
      ctx,
      shape.url,
      x - shape.padding,
      y - shape.padding,
      shape.width,
      shape.height,
      color,
    );
  };
  await paintShape(120, 28, 20, 310, "#861717", { seed: 1 });
  await paintShape(100, 36, 160, 306, "#1c1c1c", { seed: 2, raggedness: 0.8 });
  await paintShape(160, 32, 290, 308, "#4a9992", { seed: 3, taper: true });
  await paintShape(56, 56, 480, 296, "#1c1c1c", { seed: 4, corner: 0.35, raggedness: 0.7 });
  await paintShape(56, 56, 560, 296, "#1c1c1c", { seed: 5, corner: 0.1, raggedness: 0.9 });

  // 5 wash (static frame)
  label("5 wash (animated in browser) 64 / 96", 20, 380);
  await draw(ctx, inkWashUrl({ seed: 1 }), 20, 388, 64, 64);
  await draw(ctx, inkWashUrl({ seed: 2, size: 96 }), 110, 372, 96, 96, ACCENT);

  // 6 ridges
  label("6 ridges 3 layers 860x200: ink / huaqing / qingdai", 20, 490);
  const ridge = inkRidgeUrl({ seed: 7, width: 420, height: 200 });
  await draw(ctx, ridge.url, 20, 496, 280, 130);
  await draw(ctx, ridge.url, 310, 496, 280, 130, HUAQING);
  await draw(ctx, ridge.url, 600, 496, 280, 130, QINGDAI);

  // 7 cursors
  label("7 cursors auto / pointer / disabled (x2)", 20, 660);
  for (const [i, k] of (["auto", "pointer", "disabled"] as const).entries()) {
    await drawRaw(ctx, inkCursorUrl(k), 20 + i * 80, 666, 32, 32);
    await drawRaw(ctx, inkCursorUrl(k), 300 + i * 100, 650, 64, 64);
  }

  await commands.writeFile(
    "bench/results/assets-sheet.png.b64",
    canvas.toDataURL("image/png").split(",")[1]!,
  );
});
