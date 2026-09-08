import { describe, expect, it } from "vitest";
import LandscapeWorker from "./worker?worker";
import { createLandscapeRenderer } from ".";

function inkPixels(bitmap: ImageBitmap): number {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) count++;
  return count;
}

describe("landscape renderer", () => {
  it("renders depth layers as bitmaps of the requested size", async () => {
    const renderer = createLandscapeRenderer({ createWorker: () => new LandscapeWorker() });
    const result = await renderer.render(600, 240, { seed: 1000, layers: 3 });
    expect(result.seed).toBe(1000);
    expect(result.layers.map((l) => l.depth)).toEqual([0, 0.5, 1]);
    for (const layer of result.layers) {
      expect([layer.bitmap.width, layer.bitmap.height]).toEqual([600, 240]);
    }
    const painted = result.layers.map((l) => inkPixels(l.bitmap));
    expect(painted.some((n) => n > 100)).toBe(true);
    expect(result.polylines).toBeGreaterThan(0);
    for (const layer of result.layers) layer.bitmap.close();
    renderer.dispose();
  });

  it("is deterministic for the same seed", async () => {
    const renderer = createLandscapeRenderer({ createWorker: () => new LandscapeWorker() });
    const a = await renderer.render(300, 120, { seed: 7, layers: 2 });
    const b = await renderer.render(300, 120, { seed: 7, layers: 2 });
    expect(a.polylines).toBe(b.polylines);
    expect(inkPixels(a.layers[1]!.bitmap)).toBe(inkPixels(b.layers[1]!.bitmap));
    renderer.dispose();
  });
});
