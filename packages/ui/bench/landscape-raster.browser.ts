/**
 * 山水 SVG 光栅化基准（真 Chromium）：BENCH=1 pnpm bench:paper
 * 问题：7MB / 2 万条 polyline 的 SVG 字符串，怎样变成位图最快？
 *  A. 主线程 Image 解码 → drawImage
 *  B. Worker 内 createImageBitmap(svg blob)（Chrome 是否支持？）
 *  C. detail 0.25 / 0.5 / 1 对折线数与光栅化耗时的影响
 */
import { it } from "vitest";
import { commands } from "vitest/browser";
import { generateLandscape } from "@jobinjia/shuimo-core";

interface Row {
  case: string;
  genMs: number;
  rasterMs: number;
  svgKB: number;
  polylines: number;
}

const now = () => performance.now();

async function rasterViaImage(svg: string, width: number, height: number): Promise<number> {
  const t0 = now();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    return now() - t0;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function rasterViaBitmap(svg: string): Promise<number | "unsupported"> {
  const t0 = now();
  try {
    const bitmap = await createImageBitmap(new Blob([svg], { type: "image/svg+xml" }));
    bitmap.close();
    return now() - t0;
  } catch {
    return "unsupported";
  }
}

it("landscape svg rasterization timing", async () => {
  const rows: Row[] = [];
  const width = 1920;
  const height = 600;

  for (const detail of [1, 0.5, 0.25]) {
    const t0 = now();
    const { svg } = generateLandscape({
      seed: 1000,
      width,
      height,
      transparent: true,
      onXuanPaper: false,
      detail,
    });
    const genMs = now() - t0;
    const polylines = (svg.match(/<polyline\b/g) ?? []).length;
    const svgKB = Math.round(svg.length / 1024);

    const imageMs = await rasterViaImage(svg, width, height);
    rows.push({
      case: `detail ${detail} · Image decode (main thread)`,
      genMs: Math.round(genMs),
      rasterMs: Math.round(imageMs),
      svgKB,
      polylines,
    });

    const bitmapMs = await rasterViaBitmap(svg);
    rows.push({
      case: `detail ${detail} · createImageBitmap(svg blob)`,
      genMs: Math.round(genMs),
      rasterMs: bitmapMs === "unsupported" ? -1 : Math.round(bitmapMs),
      svgKB,
      polylines,
    });
  }

  // 移动端尺寸
  {
    const t0 = now();
    const { svg } = generateLandscape({
      seed: 1000,
      width: 800,
      height: 500,
      transparent: true,
      onXuanPaper: false,
      detail: 0.5,
    });
    const genMs = now() - t0;
    rows.push({
      case: "mobile 800×500 detail 0.5 · Image decode",
      genMs: Math.round(genMs),
      rasterMs: Math.round(await rasterViaImage(svg, 800, 500)),
      svgKB: Math.round(svg.length / 1024),
      polylines: (svg.match(/<polyline\b/g) ?? []).length,
    });
  }

  console.table(rows);
  await commands.writeFile(
    "bench/results/landscape-raster-latest.json",
    JSON.stringify({ userAgent: navigator.userAgent, rows }, null, 2) + "\n",
  );
}, 300_000);
