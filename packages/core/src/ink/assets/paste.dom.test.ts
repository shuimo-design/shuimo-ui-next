import { describe, expect, it } from "vitest";
import { inkPasteUrl } from "./paste";

async function alphas(url: string, size: number): Promise<number[]> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, size, size).data;
  const out: number[] = [];
  for (let i = 3; i < data.length; i += 4) out.push(data[i]!);
  return out;
}

describe("inkPasteUrl", () => {
  it("is deterministic per seed and caches the tile", () => {
    const a = inkPasteUrl({ seed: 3 });
    expect(inkPasteUrl({ seed: 3 })).toBe(a);
    expect(inkPasteUrl({ seed: 4 }).url).not.toBe(a.url);
    expect(a.size).toBe(48);
    expect(a.url.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("stays mostly solid with thinner patches, and goes fully solid at zero contrast", async () => {
    const tile = inkPasteUrl({ seed: 1 });
    const alpha = await alphas(tile.url, tile.size);
    const mean = alpha.reduce((sum, v) => sum + v, 0) / alpha.length;
    // 印泥是压实为主：平均要接近不透明，但必须有薄处，否则等于没叠这层
    expect(mean).toBeGreaterThan(180);
    expect(alpha.some((v) => v < 235)).toBe(true);
    expect(alpha.every((v) => v > 60)).toBe(true);

    const flat = await alphas(inkPasteUrl({ seed: 1, contrast: 0 }).url, 48);
    expect(flat.every((v) => v === 255)).toBe(true);
  });
});
