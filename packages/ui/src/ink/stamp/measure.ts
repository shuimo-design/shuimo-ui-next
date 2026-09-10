/**
 * 用 canvas 的 measureText 量每个字的墨迹框（actualBoundingBox 四个值就是墨迹到锚点的距离），
 * 这是浏览器里唯一不用解析字体文件就能拿到墨迹尺寸的办法。SSR 或字体没到时用兜底比例。
 */
import { FALLBACK_METRIC, PROBE_SIZE, type GlyphMeasurer, type GlyphMetric } from "./layout";

let context: CanvasRenderingContext2D | null | undefined;

function getContext(): CanvasRenderingContext2D | null {
  if (context !== undefined) return context;
  if (typeof document === "undefined") {
    context = null;
    return context;
  }
  try {
    context = document.createElement("canvas").getContext("2d");
  } catch {
    context = null;
  }
  return context;
}

/** 按字体族建一个带缓存的度量函数；同一个字只量一次 */
export function createGlyphMeasurer(fontFamily: string): GlyphMeasurer {
  const ctx = getContext();
  if (!ctx) return () => FALLBACK_METRIC;
  const cache = new Map<string, GlyphMetric>();
  const font = `${PROBE_SIZE}px ${fontFamily}`;
  return (ch) => {
    const hit = cache.get(ch);
    if (hit) return hit;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const m = ctx.measureText(ch);
    const left = m.actualBoundingBoxLeft;
    const right = m.actualBoundingBoxRight;
    const ascent = m.actualBoundingBoxAscent;
    const descent = m.actualBoundingBoxDescent;
    const w = left + right;
    const h = ascent + descent;
    const metric: GlyphMetric =
      w > 0 && h > 0 ? { w, h, left, right, ascent, descent } : FALLBACK_METRIC;
    cache.set(ch, metric);
    return metric;
  };
}

/** 等这组字的字体加载完（没有 Font Loading API 就直接返回）；失败不抛，量不准就量不准 */
export async function loadStampFont(fontFamily: string, text: string): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await document.fonts.load(`${PROBE_SIZE}px ${fontFamily}`, text);
  } catch {
    /* 字体名不合法或加载失败：退回当前能用的字体 */
  }
}
