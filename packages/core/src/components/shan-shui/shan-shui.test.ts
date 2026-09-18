import { describe, expect, it } from "vitest";
import {
  shanShuiClasses,
  shanShuiLayers,
  shanShuiParallaxMode,
  shanShuiScene,
  shanShuiStyle,
  shanShuiTier,
} from ".";

describe("shanShuiLayers", () => {
  it("clamps to 2–5 and rounds", () => {
    expect(shanShuiLayers(undefined)).toBe(3);
    expect(shanShuiLayers(1)).toBe(2);
    expect(shanShuiLayers(9)).toBe(5);
    expect(shanShuiLayers(3.6)).toBe(4);
    expect(shanShuiLayers(Number.NaN)).toBe(3);
  });
});

describe("shanShuiScene", () => {
  it("is deterministic for a seed and differs across seeds", () => {
    const a = shanShuiScene({ seed: 7, tier: 1, layers: 3, sun: true, geese: true, boat: true });
    const b = shanShuiScene({ seed: 7, tier: 1, layers: 3, sun: true, geese: true, boat: true });
    const c = shanShuiScene({ seed: 8, tier: 1, layers: 3, sun: true, geese: true, boat: true });
    expect(a).toEqual(b);
    expect(a.map((l) => l.style)).not.toEqual(c.map((l) => l.style));
  });

  it("stacks sun, ridges far to near, then the boat, with rising depth", () => {
    const scene = shanShuiScene({
      seed: 3,
      tier: 1,
      layers: 4,
      sun: true,
      geese: true,
      boat: true,
    });
    expect(scene.map((l) => l.kind)).toEqual([
      "sun",
      "geese",
      "ridge",
      "ridge",
      "ridge",
      "ridge",
      "boat",
    ]);
    const ridges = scene.filter((l) => l.kind === "ridge");
    for (let i = 1; i < ridges.length; i++) {
      expect(ridges[i]!.depth).toBeGreaterThan(ridges[i - 1]!.depth);
      // 远山高、近山矮
      expect(Number.parseFloat(ridges[i]!.style.height!)).toBeLessThan(
        Number.parseFloat(ridges[i - 1]!.style.height!),
      );
    }
    // 每层都有自己的遮罩和实心剪影，且两层山不是同一张图
    for (const ridge of ridges) {
      expect(ridge.style["--m-shan-shui-mask"]).toMatch(/^url\("data:image\/svg\+xml/);
      expect(ridge.style["--m-shan-shui-silhouette"]).toMatch(/^url\("data:image\/svg\+xml/);
      expect(ridge.style["--m-shan-shui-silhouette"]).not.toBe(ridge.style["--m-shan-shui-mask"]);
    }
    expect(ridges[0]!.style["--m-shan-shui-mask"]).not.toBe(ridges[1]!.style["--m-shan-shui-mask"]);
    expect(scene.at(-1)!.depth).toBeGreaterThan(ridges.at(-1)!.depth);
    expect(scene[0]!.depth).toBeLessThan(ridges[0]!.depth);
  });

  it("drops the optional pieces when asked", () => {
    const scene = shanShuiScene({
      seed: 3,
      tier: 1,
      layers: 2,
      sun: false,
      geese: false,
      boat: false,
    });
    expect(scene.map((l) => l.kind)).toEqual(["ridge", "ridge"]);
  });

  it("writes no mask at tier 0 so the CSS falls back to flat bands", () => {
    const scene = shanShuiScene({
      seed: 3,
      tier: 0,
      layers: 3,
      sun: true,
      geese: true,
      boat: true,
    });
    for (const layer of scene) expect(layer.style["--m-shan-shui-mask"]).toBe("none");
    // 位置和 tier 无关：同 seed 的 tier 0 与 tier 1 落在同一处
    const ink = shanShuiScene({ seed: 3, tier: 1, layers: 3, sun: true, geese: true, boat: true });
    expect(scene.map((l) => [l.style.left, l.style.top, l.style.height])).toEqual(
      ink.map((l) => [l.style.left, l.style.top, l.style.height]),
    );
  });
});

describe("classes / style / mode", () => {
  it("derives the class list", () => {
    expect(shanShuiClasses({ ready: false, palette: "ink", parallax: "none", tier: 0 })).toEqual([
      "m-shan-shui",
      "m-shan-shui--ink",
      "m-shan-shui--tier-0",
    ]);
    expect(shanShuiClasses({ ready: true, palette: "dusk", parallax: "scroll", tier: 2 })).toEqual([
      "m-shan-shui",
      "m-shan-shui--dusk",
      "m-shan-shui--tier-2",
      "m-shan-shui--ready",
      "m-shan-shui--parallax-scroll",
    ]);
  });

  it("puts the height into the variable, px for numbers and as-is for strings", () => {
    expect(shanShuiStyle({ height: undefined })).toEqual({ "--m-shan-shui-height": "60vh" });
    expect(shanShuiStyle({ height: 320 })).toEqual({ "--m-shan-shui-height": "320px" });
    expect(shanShuiStyle({ height: "50dvh" })).toEqual({ "--m-shan-shui-height": "50dvh" });
  });

  it("uses the prop tier over the detected one and stops parallax at tier 0", () => {
    expect(shanShuiTier(undefined, 2)).toBe(2);
    expect(shanShuiTier(0, 2)).toBe(0);
    expect(shanShuiParallaxMode("pointer", 0)).toBe("none");
    expect(shanShuiParallaxMode("pointer", 1)).toBe("pointer");
  });
});
