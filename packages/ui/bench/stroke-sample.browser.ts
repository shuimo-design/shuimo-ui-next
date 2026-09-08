/** 把笔触边框变体渲染成一张对比图落盘，供人眼检查：BENCH=1 vp test bench/stroke-sample */
import { it } from "vitest";
import { commands } from "vitest/browser";
import {
  generateBrushBorder,
  svgToDataUrl,
  type BrushBorderOptions,
} from "../src/ink/stroke/generate";

async function drawSvg(
  ctx: CanvasRenderingContext2D,
  svg: string,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
) {
  const img = new Image();
  img.src = svgToDataUrl(svg);
  await img.decode();
  ctx.drawImage(img, x, y, w * scale, h * scale);
}

it("dump brush border variants", async () => {
  const W = 360;
  const H = 110;
  const scale = 2;
  const variants: { name: string; o: BrushBorderOptions }[] = [
    { name: "1 brush w3 (default)", o: { seed: 7 } },
    { name: "2 brush w3 seed 12", o: { seed: 12 } },
    { name: "3 brush w4 rough.7", o: { seed: 7, strokeWidth: 4, roughness: 0.7 } },
    { name: "4 brush w2 (button-ish)", o: { seed: 7, strokeWidth: 2 } },
    { name: "5 shanshui w3", o: { seed: 7, renderer: "shanshui" } },
    {
      name: "6 shanshui w5 rough.9",
      o: { seed: 7, renderer: "shanshui", strokeWidth: 5, roughness: 0.9 },
    },
  ];
  const pad = 16;
  const rowH = (H + pad * 3) * scale;
  const canvas = document.createElement("canvas");
  canvas.width = (W + pad * 4) * scale;
  canvas.height = rowH * variants.length;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4efe3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#333";
  ctx.font = `${12 * scale}px sans-serif`;
  for (const [i, v] of variants.entries()) {
    const border = generateBrushBorder(W, H, v.o);
    const y = i * rowH;
    ctx.fillText(v.name, pad * scale, y + 14 * scale);
    await drawSvg(
      ctx,
      border.svg,
      (pad * 2 - border.padding) * scale,
      y + (pad * 2 - border.padding) * scale,
      border.width,
      border.height,
      scale,
    );
  }
  await commands.writeFile(
    "bench/results/stroke-variants.png.b64",
    canvas.toDataURL("image/png").split(",")[1]!,
  );
});
