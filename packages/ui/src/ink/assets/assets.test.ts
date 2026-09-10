import { describe, expect, it } from "vitest";
import {
  brushLineUrl,
  ensureInkAssets,
  inkBlobUrl,
  inkCursorUrl,
  inkMarkUrl,
  inkRidgeUrl,
  inkScaleUrl,
  inkShapeUrl,
  inkWashUrl,
} from ".";

async function decode(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

/** 把图画到画布上，返回按坐标取 alpha 的函数 */
async function alphaSampler(
  url: string,
  width: number,
  height: number,
): Promise<(x: number, y: number) => number> {
  const img = await decode(url);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return (x, y) => ctx.getImageData(x, y, 1, 1).data[3]!;
}

describe("ink assets", () => {
  it("every generator is deterministic and decodes as an image", async () => {
    const urls = [
      brushLineUrl({ seed: 1 }).url,
      brushLineUrl({ seed: 1, vertical: true }).url,
      inkMarkUrl("check", { seed: 1 }),
      inkMarkUrl("dot", { seed: 1 }),
      inkBlobUrl({ seed: 1 }),
      inkShapeUrl(120, 28, { seed: 1 }).url,
      inkWashUrl({ seed: 1 }),
      inkRidgeUrl({ seed: 1, width: 400, height: 100 }).url,
      inkCursorUrl("pointer"),
      inkScaleUrl().url,
    ];
    for (const url of urls) {
      expect(url.startsWith("data:image/svg+xml")).toBe(true);
      expect(url).not.toMatch(/[<>#"]/);
      const img = await decode(url);
      expect(img.naturalWidth).toBeGreaterThan(0);
    }
    expect(inkMarkUrl("check", { seed: 1 })).toBe(inkMarkUrl("check", { seed: 1 }));
    expect(inkMarkUrl("check", { seed: 1 })).not.toBe(inkMarkUrl("check", { seed: 2 }));
    expect(inkShapeUrl(121, 29, { seed: 1 })).toBe(inkShapeUrl(123, 31, { seed: 1 }));
  });

  it("ridge silhouettes are opaque at the bottom and clear at the top", async () => {
    const alpha = await alphaSampler(
      inkRidgeUrl({ seed: 3, width: 400, height: 200, opacity: 1 }).url,
      400,
      200,
    );
    expect(alpha(200, 195)).toBeGreaterThan(60);
    expect(alpha(200, 5)).toBe(0);
  });

  it("nearer ridge layers cut out farther ones instead of stacking ink", async () => {
    // 不带雾气：近层 0.5、远层 0.15，叠加会到 0.575，抠掉后山脚处只剩近层自己的 0.5
    const ridge = inkRidgeUrl({
      seed: 5,
      width: 400,
      height: 200,
      layers: 2,
      opacity: 0.5,
      mist: 0,
    });
    const ink = await alphaSampler(ridge.url, 400, 200);
    expect(ink(200, 195)).toBeGreaterThan(118);
    expect(ink(200, 195)).toBeLessThan(138);
    // 实心剪影：山脚全不透明、天空全透明，拿来垫纸色挡后面的山
    const solid = await alphaSampler(ridge.silhouette, 400, 200);
    expect(solid(200, 195)).toBe(255);
    expect(solid(200, 5)).toBe(0);
  });

  it("ensureInkAssets writes root variables and cleans up", () => {
    const dispose = ensureInkAssets({ seed: 4 });
    const root = getComputedStyle(document.documentElement);
    expect(root.getPropertyValue("--m-ink-mark-check")).toContain("data:image/svg+xml");
    expect(root.getPropertyValue("--m-ink-mark-chevron-down")).toContain("data:image/svg+xml");
    expect(root.getPropertyValue("--m-cursor-pointer")).toContain("pointer");
    dispose();
    expect(document.documentElement.style.getPropertyValue("--m-ink-mark-check")).toBe("");
  });
});
