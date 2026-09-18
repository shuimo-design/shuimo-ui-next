import { describe, expect, it } from "vitest";
import {
  readingStrokeAria,
  readingStrokeClasses,
  readingStrokeMask,
  readingStrokePercent,
  readingStrokeProgress,
  readingStrokeStyle,
} from ".";

describe("readingStrokeProgress", () => {
  it("maps scroll position to 0–1 and clamps", () => {
    expect(readingStrokeProgress(0, 2000, 500)).toBe(0);
    expect(readingStrokeProgress(750, 2000, 500)).toBe(0.5);
    expect(readingStrokeProgress(1500, 2000, 500)).toBe(1);
    // iOS 回弹会超出范围
    expect(readingStrokeProgress(1600, 2000, 500)).toBe(1);
    expect(readingStrokeProgress(-20, 2000, 500)).toBe(0);
  });

  it("is 0 when the container cannot scroll", () => {
    expect(readingStrokeProgress(0, 500, 500)).toBe(0);
    expect(readingStrokeProgress(0, 300, 500)).toBe(0);
  });

  it("rounds to whole percent points", () => {
    expect(readingStrokePercent(0.004)).toBe(0);
    expect(readingStrokePercent(0.005)).toBe(1);
    expect(readingStrokePercent(0.4249)).toBe(42);
    expect(readingStrokePercent(1)).toBe(100);
  });
});

describe("readingStrokeMask", () => {
  it("is null until the width is known, then buckets the length by 64px", () => {
    expect(readingStrokeMask({ seed: 1, thickness: 4, width: 0 })).toBeNull();
    const a = readingStrokeMask({ seed: 1, thickness: 4, width: 1000 })!;
    const b = readingStrokeMask({ seed: 1, thickness: 4, width: 1020 })!;
    const c = readingStrokeMask({ seed: 1, thickness: 4, width: 1100 })!;
    expect(a.url).toMatch(/^data:image\/svg\+xml/);
    // 1000 和 1020 同落在 1024 那一桶
    expect(a.url).toBe(b.url);
    expect(c.url).not.toBe(a.url);
    expect(decodeURIComponent(a.url)).toContain("width='1024'");
    // 画幅高度 = 笔宽 × 2 + 两侧留白，条按它撑高
    expect(a.height).toBeGreaterThan(4);
  });

  it("differs by seed and thickness", () => {
    const a = readingStrokeMask({ seed: 1, thickness: 4, width: 640 })!;
    const b = readingStrokeMask({ seed: 2, thickness: 4, width: 640 })!;
    const c = readingStrokeMask({ seed: 1, thickness: 8, width: 640 })!;
    expect(a.url).not.toBe(b.url);
    expect(c.height).toBeGreaterThan(a.height);
  });
});

describe("classes / style / aria", () => {
  it("derives the class list", () => {
    expect(readingStrokeClasses({ position: "top", masked: false, progress: 0.3 })).toEqual([
      "m-reading-stroke",
      "m-reading-stroke--top",
    ]);
    expect(readingStrokeClasses({ position: "bottom", masked: true, progress: 1 })).toEqual([
      "m-reading-stroke",
      "m-reading-stroke--bottom",
      "m-reading-stroke--masked",
      "m-reading-stroke--done",
    ]);
  });

  it("writes the variables; no mask before the width is measured", () => {
    const plain = readingStrokeStyle({
      seed: 1,
      thickness: 4,
      width: 0,
      color: undefined,
      zIndex: undefined,
      progress: 0,
    });
    expect(plain).toEqual({
      "--m-reading-stroke-thickness": "4px",
      "--m-reading-stroke-color": "var(--m-ink)",
      "--m-reading-stroke-z": "9000",
      "--m-reading-stroke-progress": "0.0000",
      "--m-reading-stroke-band": "4px",
      "--m-reading-stroke-mask": "none",
    });
    const inked = readingStrokeStyle({
      seed: 1,
      thickness: 6,
      width: 800,
      color: "#861717",
      zIndex: 20,
      progress: 0.42,
    });
    expect(inked["--m-reading-stroke-color"]).toBe("#861717");
    expect(inked["--m-reading-stroke-z"]).toBe("20");
    expect(inked["--m-reading-stroke-progress"]).toBe("0.4200");
    expect(inked["--m-reading-stroke-mask"]).toMatch(/^url\("data:image\/svg\+xml/);
    expect(inked["--m-reading-stroke-band"]).toMatch(/^\d+px$/);
    expect(Number.parseInt(inked["--m-reading-stroke-band"]!, 10)).toBeGreaterThan(6);
  });

  it("exposes a progressbar with whole-percent aria-valuenow", () => {
    expect(readingStrokeAria(0.256)).toEqual({
      role: "progressbar",
      "aria-label": "阅读进度",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": 26,
    });
  });
});
