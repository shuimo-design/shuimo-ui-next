import { describe, expect, it } from "vitest";
import PaperWorker from "./worker?worker";
import { createPaperRenderer } from ".";

function sampleVariance(bitmap: ImageBitmap): number {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  let sum = 0;
  let sumSq = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i]!;
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

describe("paper renderer", () => {
  it("renders a tiled paper bitmap of the requested size", async () => {
    const renderer = createPaperRenderer({ workers: 4, createWorker: () => new PaperWorker() });
    const bitmap = await renderer.render(300, 180, { seed: 7, deckleEdge: false });
    expect(bitmap.width).toBe(300);
    expect(bitmap.height).toBe(180);
    // 纹理不是纯色
    expect(sampleVariance(bitmap)).toBeGreaterThan(1);
    bitmap.close();
    renderer.dispose();
  });

  it("single worker path also works", async () => {
    const renderer = createPaperRenderer({ workers: 1, createWorker: () => new PaperWorker() });
    const bitmap = await renderer.render(64, 64, { seed: 7, deckleEdge: false });
    expect([bitmap.width, bitmap.height]).toEqual([64, 64]);
    bitmap.close();
    renderer.dispose();
  });
});
