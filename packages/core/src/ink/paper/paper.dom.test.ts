import { describe, expect, it } from "vitest";
import { deckleMaskUrl, generateGoldFlecks, goldFleckUrl, paperTextureUrl } from ".";

async function pixelsOf(url: string, w: number, h: number): Promise<Uint8ClampedArray> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

describe("paper texture", () => {
  it("is cached per options and differs by seed", () => {
    expect(paperTextureUrl({ seed: 1 })).toBe(paperTextureUrl({ seed: 1 }));
    expect(paperTextureUrl({ seed: 1 })).not.toBe(paperTextureUrl({ seed: 2 }));
    expect(paperTextureUrl({ seed: 1 })).not.toBe(paperTextureUrl({ seed: 1, fibers: 0 }));
  });

  it("renders an opaque tile close to the base color with visible grain", async () => {
    const size = 64;
    const data = await pixelsOf(
      paperTextureUrl({ seed: 3, baseColor: [240, 228, 200], size }),
      size,
      size,
    );
    let sum = 0;
    let min = 255;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      expect(data[i + 3]).toBe(255);
      const r = data[i]!;
      sum += r;
      min = Math.min(min, r);
      max = Math.max(max, r);
    }
    const mean = sum / (data.length / 4);
    // 均值落在底色附近（相乘只会变暗一点），但不是一片平色
    expect(mean).toBeGreaterThan(190);
    expect(mean).toBeLessThan(241);
    expect(max - min).toBeGreaterThan(8);
  });

  it("deckle mask is opaque in the middle, frayed and half-transparent at the edges", async () => {
    const size = 160;
    const data = await pixelsOf(
      deckleMaskUrl({ seed: 5, amount: 0.8, width: size, height: size }),
      size,
      size,
    );
    const alphaAt = (x: number, y: number) => data[(y * size + x) * 4 + 3]!;
    expect(alphaAt(80, 80)).toBe(255);
    expect(alphaAt(0, 0)).toBeLessThan(40);
    // 边缘一圈不是整齐的直线：同一列上不同行的透明度不全相同
    const column = Array.from({ length: size }, (_, y) => alphaAt(3, y));
    expect(new Set(column).size).toBeGreaterThan(4);
    // 撕口外面有半透明的薄纸和纤维：靠边一圈里要有大量既不是 0 也不是 255 的像素
    let soft = 0;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < 24; x++) {
        const a = alphaAt(x, y);
        if (a > 8 && a < 247) soft++;
      }
    expect(soft).toBeGreaterThan(200);
    // 纤维是一根根 path，不是位移滤镜
    const svg = decodeURIComponent(
      deckleMaskUrl({ seed: 5, amount: 0.8, width: size, height: size }),
    );
    expect(svg).not.toContain("feDisplacementMap");
    // 纤维：起点绝对坐标、之后相对增量（l / q）
    expect((svg.match(/M[\d.]+ [\d.]+[lq]/g) ?? []).length).toBeGreaterThan(150);
    // 同尺寸同种子同图，尺寸不同就重新生成
    expect(deckleMaskUrl({ seed: 5, width: 300, height: 120 })).toBe(
      deckleMaskUrl({ seed: 5, width: 300, height: 120 }),
    );
    expect(deckleMaskUrl({ seed: 5, width: 300, height: 120 })).not.toBe(
      deckleMaskUrl({ seed: 5, width: 320, height: 120 }),
    );
  });

  it("carries vector fibers and particles that wrap at the tile edges", () => {
    const url = decodeURIComponent(paperTextureUrl({ seed: 4, size: 256 }));
    const fibers = url.match(/<path /g)?.length ?? 0;
    const particles = url.match(/<ellipse /g)?.length ?? 0;
    expect(fibers).toBeGreaterThan(5);
    expect(particles).toBeGreaterThan(20);
    // 关掉就没有
    const bare = decodeURIComponent(
      paperTextureUrl({ seed: 4, size: 256, fibers: 0, particles: 0 }),
    );
    expect(bare).not.toContain("<path ");
    expect(bare).not.toContain("<ellipse ");
  });
});

describe("gold flecks", () => {
  it("scales the count with area and density, mostly dust with a few flakes", () => {
    const small = generateGoldFlecks({ seed: 1, size: 256, density: 0.5 });
    const big = generateGoldFlecks({ seed: 1, size: 512, density: 0.5 });
    const dense = generateGoldFlecks({ seed: 1, size: 256, density: 1 });
    expect(big.length).toBeGreaterThan(small.length * 3);
    expect(dense.length).toBeGreaterThan(small.length * 1.5);
    const flakes = small.filter((f) => f.flake).length;
    expect(flakes).toBeGreaterThan(0);
    expect(flakes / small.length).toBeLessThan(0.3);
    // 金箔有弧边，金粉只有直边
    expect(small.some((f) => f.flake && f.commands.some((c) => c.type === "Q"))).toBe(true);
    expect(small.every((f) => f.flake || f.commands.every((c) => c.type !== "Q"))).toBe(true);
    expect(generateGoldFlecks({ seed: 1, size: 256, density: 0 })).toEqual([]);
  });

  it("is deterministic per seed and wraps edge flecks to the opposite side", () => {
    const a = generateGoldFlecks({ seed: 9, size: 256 });
    const b = generateGoldFlecks({ seed: 9, size: 256 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(generateGoldFlecks({ seed: 10, size: 256 }));
    expect(a.some((f) => f.copies.length > 1)).toBe(true);
    for (const f of a) expect(f.copies[0]).toEqual({ x: 0, y: 0 });
  });

  it("renders a transparent tile with gold-coloured pixels", async () => {
    const size = 256;
    const data = await pixelsOf(goldFleckUrl({ seed: 2, size }), size, size);
    let painted = 0;
    let gold = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! > 0) {
        painted++;
        if (data[i]! > data[i + 2]! + 40) gold++;
      }
    }
    // 大部分是透明的，画到的地方是暖金色
    expect(painted).toBeGreaterThan(50);
    expect(painted).toBeLessThan(size * size * 0.25);
    expect(gold / painted).toBeGreaterThan(0.9);
    expect(goldFleckUrl({ seed: 2, size })).toBe(goldFleckUrl({ seed: 2, size }));
    expect(goldFleckUrl({ seed: 2, size, color: "silver" })).not.toBe(
      goldFleckUrl({ seed: 2, size }),
    );
  });
});
