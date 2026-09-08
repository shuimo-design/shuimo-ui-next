import { describe, expect, it } from "vitest";
import { generateBrushBorder, svgToDataUrl } from "./generate";
import { brushBorderUrl } from ".";

describe("brush border", () => {
  it("is deterministic per seed and differs across seeds", () => {
    const a = generateBrushBorder(200, 40, { seed: 3 });
    const b = generateBrushBorder(200, 40, { seed: 3 });
    const c = generateBrushBorder(200, 40, { seed: 4 });
    expect(a.svg).toBe(b.svg);
    expect(a.svg).not.toBe(c.svg);
    expect(a.svg.startsWith("<svg")).toBe(true);
    expect(a.width).toBe(200 + a.padding * 2);
    expect(a.svg.match(/<polyline/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("data url is CSS-safe and renders as an image", async () => {
    const { svg, width, height } = generateBrushBorder(120, 48, { seed: 9 });
    const url = svgToDataUrl(svg);
    expect(url).not.toMatch(/[<>#"]/);
    const img = new Image();
    img.src = url;
    await img.decode();
    expect([img.naturalWidth, img.naturalHeight]).toEqual([width, height]);
  });

  it("caches by size bucket", async () => {
    const a = await brushBorderUrl(101, 33, { seed: 1 });
    const b = await brushBorderUrl(103, 35, { seed: 1 });
    const c = await brushBorderUrl(120, 33, { seed: 1 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("generates a large border quickly", () => {
    const t0 = performance.now();
    generateBrushBorder(800, 400, { seed: 5 });
    expect(performance.now() - t0).toBeLessThan(50);
  });
});
