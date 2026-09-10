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
    // 四条边，每边至少一条墨带
    expect(a.svg.match(/<path /g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("more flying white means more broken ribbons", () => {
    const dry = generateBrushBorder(300, 80, { seed: 2, flyingWhite: 0.6 });
    const wet = generateBrushBorder(300, 80, { seed: 2, flyingWhite: 0 });
    const count = (svg: string) => svg.match(/<path /g)?.length ?? 0;
    expect(count(dry.svg)).toBeGreaterThan(count(wet.svg));
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

  it("caches by size bucket", () => {
    const a = brushBorderUrl(101, 33, { seed: 1 });
    const b = brushBorderUrl(103, 35, { seed: 1 });
    const c = brushBorderUrl(120, 33, { seed: 1 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("reveal embeds one SMIL mask per edge with sequential timing", () => {
    const { svg } = generateBrushBorder(200, 60, { seed: 1, reveal: { duration: 1000 } });
    expect(svg.match(/<mask /g)).toHaveLength(4);
    expect(svg.match(/<animate /g)).toHaveLength(4);
    const begins = [...svg.matchAll(/begin="([\d.]+)s"/g)].map((m) => Number(m[1]));
    expect(begins[0]).toBe(0);
    expect(begins).toEqual([...begins].sort((a, b) => a - b));
    expect(svg).not.toBe(generateBrushBorder(200, 60, { seed: 1 }).svg);
  });

  it("generates a large border quickly", () => {
    const t0 = performance.now();
    generateBrushBorder(800, 400, { seed: 5 });
    expect(performance.now() - t0).toBeLessThan(50);
  });
});
