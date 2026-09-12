import { describe, expect, it } from "vitest";
import { getGlyphMeasurer, isStampFontReady, preloadStampFont } from "./measure";

describe("stamp font", () => {
  it("reuses one measurer per family, so the same glyph is measured once", () => {
    expect(getGlyphMeasurer("serif")).toBe(getGlyphMeasurer("serif"));
    expect(getGlyphMeasurer("serif")).not.toBe(getGlyphMeasurer("monospace"));

    const measure = getGlyphMeasurer("serif");
    const metric = measure("印");
    // 同一个字第二次拿到的是缓存里那一份，不再进 canvas
    expect(measure("印")).toBe(metric);
    expect(metric.w).toBeGreaterThan(0);
    expect(metric.h).toBeGreaterThan(0);
  });

  it("calls a system font ready right away and a pending web font not ready", () => {
    // 系统字体不用下载，一律算就绪 —— 这条就是"第一帧直接量准"的前提
    expect(isStampFontReady("serif", "印章")).toBe(true);
    // 没声明过 @font-face 的名字也算就绪：浏览器会拿后备字体画，不存在"等它下载完"这回事
    expect(isStampFontReady("压根没有这个字体", "印章")).toBe(true);

    // 声明了、还没下载完的网络字体才算没就绪，这时候才要走异步等
    const face = new FontFace("测试篆体", "url(data:font/woff2;base64,AAAA)");
    document.fonts.add(face);
    try {
      expect(isStampFontReady("测试篆体", "印章")).toBe(false);
    } finally {
      document.fonts.delete(face);
    }
  });

  it("preloads the family on --m-font-seal and survives a bogus one", async () => {
    document.documentElement.style.setProperty("--m-font-seal", "serif");
    await expect(preloadStampFont()).resolves.toBeUndefined();
    // 字体名不合法时不许抛：印章退回兜底比例排版就是了
    await expect(preloadStampFont({ font: "((", text: "印" })).resolves.toBeUndefined();
    document.documentElement.style.removeProperty("--m-font-seal");
  });
});
