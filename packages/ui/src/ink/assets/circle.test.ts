import { describe, expect, it } from "vitest";
import { inkCircleUrl } from "./circle";

async function decode(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

describe("ink circle", () => {
  it("is deterministic per seed, CSS-safe and decodes as an image", async () => {
    const a = inkCircleUrl({ seed: 3 });
    expect(a).toBe(inkCircleUrl({ seed: 3 }));
    expect(a).not.toBe(inkCircleUrl({ seed: 4 }));
    expect(a.startsWith("data:image/svg+xml")).toBe(true);
    expect(a).not.toMatch(/[<>#"]/);
    const img = await decode(inkCircleUrl({ seed: 3, size: 40 }));
    expect([img.naturalWidth, img.naturalHeight]).toEqual([40, 40]);
  });

  it("paints a hollow ring: opaque on the circle, clear in the middle", async () => {
    const size = 80;
    const img = await decode(inkCircleUrl({ seed: 5, size }));
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const alpha = (x: number, y: number) => ctx.getImageData(x, y, 1, 1).data[3]!;
    // 圆心留白
    expect(alpha(size / 2, size / 2)).toBe(0);
    // 四个方向的环上都有墨：沿半径扫一遍，取最大 alpha
    const c = size / 2;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      let peak = 0;
      for (let r = size * 0.25; r < c; r++) {
        peak = Math.max(peak, alpha(Math.round(c + dx * r), Math.round(c + dy * r)));
      }
      expect(peak).toBeGreaterThan(120);
    }
  });
});
