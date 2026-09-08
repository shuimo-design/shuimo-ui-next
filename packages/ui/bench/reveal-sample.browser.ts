/** 落墨效果人眼检查：擦入遮罩毛边 + 笔触边框描出的三个时刻。BENCH=1 vp test bench/reveal-sample */
import { it } from "vitest";
import { commands } from "vitest/browser";
import { wipeMaskUrl } from "../src/ink/reveal/mask";
import { generateBrushBorder, svgToDataUrl } from "../src/ink/stroke/generate";

async function load(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  document.body.append(img);
  await img.decode();
  return img;
}

it("dump reveal samples", async () => {
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = 420 * scale;
  canvas.height = 560 * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4efe3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#333";
  ctx.font = `${12 * scale}px sans-serif`;

  // 1. 擦入遮罩（黑 = 可见区域）
  const wipe = await load(wipeMaskUrl({ seed: 7 }));
  ctx.fillText("wipe mask seed 7 (right)", 16 * scale, 18 * scale);
  ctx.drawImage(wipe, 16 * scale, 24 * scale, 388 * scale, 100 * scale);
  const wipeDown = await load(wipeMaskUrl({ seed: 7, direction: "down" }));
  ctx.fillText("wipe mask (down)", 16 * scale, 146 * scale);
  ctx.drawImage(wipeDown, 16 * scale, 152 * scale, 100 * scale, 100 * scale);

  // 2. 笔触边框描出：同一张动画 SVG 在 0.3s / 0.7s / 1.4s 的样子
  const border = generateBrushBorder(360, 60, { seed: 7, reveal: { duration: 1200 } });
  const img = await load(svgToDataUrl(border.svg));
  const t0 = performance.now();
  const times = [300, 700, 1400];
  for (const [i, t] of times.entries()) {
    await new Promise((r) => setTimeout(r, Math.max(0, t - (performance.now() - t0))));
    const y = (270 + i * 95) * scale;
    ctx.fillText(`border reveal @ ${t}ms`, 16 * scale, y - 6 * scale);
    ctx.drawImage(
      img,
      (30 - border.padding) * scale,
      y,
      border.width * scale,
      border.height * scale,
    );
  }
  await commands.writeFile(
    "bench/results/reveal-samples.png.b64",
    canvas.toDataURL("image/png").split(",")[1]!,
  );
});
