import { describe, expect, it } from "vitest";
import {
  resolveWatermark,
  watermarkClasses,
  watermarkLines,
  watermarkStyle,
  watermarkSvg,
  watermarkTextSize,
  watermarkTile,
  watermarkUrl,
} from ".";

describe("resolveWatermark", () => {
  it("fills in the defaults and estimates the text box", () => {
    const r = resolveWatermark({ content: "水墨" });
    expect(r.lines).toEqual(["水墨"]);
    expect(r.fontSize).toBe(14);
    expect(r.rotate).toBe(-22);
    expect(r.gap).toEqual([100, 100]);
    // 偏移默认各取间距的一半
    expect(r.offset).toEqual([50, 50]);
    // 两个全角字：宽 2 × 14，高一行 × 14 × 1.4
    expect(r.width).toBe(28);
    expect(r.height).toBe(20);
    expect(r.zIndex).toBe(9);
    expect(r.ink).toBe(true);
    expect(r.seed).toBe(1);
  });

  it("switches to image mode and drops the text and ink", () => {
    const r = resolveWatermark({ content: "水墨", image: "/seal.png", ink: true });
    expect(r.lines).toEqual([]);
    expect(r.image).toBe("/seal.png");
    expect(r.ink).toBe(false);
    expect([r.width, r.height]).toEqual([120, 64]);
  });

  it("keeps explicit size, offset and font", () => {
    const r = resolveWatermark({
      content: ["山", "水"],
      width: 80,
      height: 40,
      offset: [0, 10],
      font: { size: 20, weight: 700, family: "serif", color: "red" },
    });
    expect([r.width, r.height]).toEqual([80, 40]);
    expect(r.offset).toEqual([0, 10]);
    expect(r.fontSize).toBe(20);
    expect(r.fontWeight).toBe(700);
    expect(r.fontFamily).toBe("serif");
    expect(r.color).toBe("red");
  });
});

describe("watermarkLines / watermarkTextSize", () => {
  it("splits content into non-empty lines", () => {
    expect(watermarkLines(undefined)).toEqual([]);
    expect(watermarkLines("一行")).toEqual(["一行"]);
    expect(watermarkLines(["上", "", "下"])).toEqual(["上", "下"]);
  });

  it("counts full-width characters as one em and the rest as 0.6", () => {
    expect(watermarkTextSize(["ab"], 10)).toEqual([12, 14]);
    expect(watermarkTextSize(["水墨", "a"], 10)).toEqual([20, 28]);
  });
});

describe("watermarkTile", () => {
  it("is the rotated bounding box plus the gap", () => {
    expect(watermarkTile({ width: 100, height: 20, rotate: 0, gap: [10, 4] })).toEqual([110, 24]);
    expect(watermarkTile({ width: 100, height: 20, rotate: 90, gap: [0, 0] })).toEqual([20, 100]);
    // 45°：两边都是 (100 + 20) × √2 / 2 ≈ 84.85 → 85
    expect(watermarkTile({ width: 100, height: 20, rotate: 45, gap: [0, 0] })).toEqual([85, 85]);
  });
});

describe("watermarkSvg", () => {
  const base = {
    lines: ["水墨", "丹青"],
    fontSize: 14,
    fontFamily: "serif",
    fontWeight: 400,
    rotate: -22,
    gap: [100, 100] as [number, number],
    width: 28,
    height: 40,
    ink: false,
    seed: 1,
  };

  it("draws one tspan per line, black, centred and rotated", () => {
    const svg = watermarkSvg(base);
    expect(svg).toContain('width="141" height="148"');
    expect(svg.match(/<tspan/g)).toHaveLength(2);
    expect(svg).toContain('fill="#000"');
    expect(svg).toContain("rotate(-22)");
    expect(svg).toContain("translate(70.5 74)");
    expect(svg).not.toContain("<filter");
  });

  it("wraps the text in a seeded bleed filter when ink is on", () => {
    const svg = watermarkSvg({ ...base, ink: true, seed: 7 });
    expect(svg).toContain('<filter id="b"');
    expect(svg).toContain('seed="7"');
    expect(svg).toContain('<g filter="url(#b)">');
  });

  it("escapes markup in the text and the font family", () => {
    const svg = watermarkSvg({ ...base, lines: ['<a & "b">'], fontFamily: '"Noto Serif"' });
    expect(svg).toContain("&lt;a &amp; &quot;b&quot;&gt;");
    expect(svg).toContain('font-family="&quot;Noto Serif&quot;"');
    expect(svg).not.toContain("<a");
  });

  it("places an image instead of text", () => {
    const svg = watermarkSvg({
      ...base,
      lines: [],
      image: "/a.png?x=1&y=2",
      width: 120,
      height: 64,
    });
    expect(svg).toContain('<image href="/a.png?x=1&amp;y=2"');
    expect(svg).toContain('x="-60" y="-32" width="120" height="64"');
    expect(svg).not.toContain("<text");
  });

  it("caches the data URL by its parameters", () => {
    const a = watermarkUrl(base);
    expect(a.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(watermarkUrl({ ...base })).toBe(a);
    expect(watermarkUrl({ ...base, seed: 2, ink: true })).not.toBe(a);
  });
});

describe("watermarkStyle / watermarkClasses", () => {
  it("hands both the plain and the inked mask to CSS", () => {
    const r = resolveWatermark({ content: "水墨", font: { color: "rgb(0 0 0 / 0.2)" } });
    const style = watermarkStyle(r);
    expect(style["--m-watermark-image"]).toMatch(/^url\("data:image\/svg\+xml/);
    expect(style["--m-watermark-image-ink"]).not.toBe(style["--m-watermark-image"]);
    expect(style["--m-watermark-tile"]).toBe("134px 130px");
    expect(style["--m-watermark-offset"]).toBe("50px 50px");
    expect(style["--m-watermark-z"]).toBe("9");
    expect(style["--m-watermark-color"]).toBe("rgb(0 0 0 / 0.2)");
  });

  it("uses one image for both skins when ink is off", () => {
    const style = watermarkStyle(resolveWatermark({ content: "水墨", ink: false }));
    expect(style["--m-watermark-image-ink"]).toBe(style["--m-watermark-image"]);
    expect(style["--m-watermark-color"]).toBeUndefined();
  });

  it("derives the modifier classes", () => {
    expect(watermarkClasses({ image: false, ink: true })).toEqual([
      "m-watermark",
      "m-watermark--text",
      "m-watermark--ink",
    ]);
    expect(watermarkClasses({ image: true, ink: false })).toEqual([
      "m-watermark",
      "m-watermark--image",
    ]);
  });
});
