/**
 * 用 canvas 的 measureText 量每个字的墨迹框（actualBoundingBox 四个值就是墨迹到锚点的距离），
 * 这是浏览器里唯一不用解析字体文件就能拿到墨迹尺寸的办法。SSR 或字体没到时用兜底比例。
 *
 * 字体没到位时量出来的是**兜底比例**，印章会先排一版、字体到了再重排一次 —— 看上去就是跳一下。
 * 篆体这类中文字体动辄几 MB，这一跳很显眼。两条对策都在这个文件里：
 *  1. `preloadStampFont()` —— 启动时就把字体拉下来，等第一枚印章要画的时候字体已经在了；
 *  2. `isStampFontReady()` —— 同步问浏览器「现在就能用吗」，能用就当场量完，第一帧直接是对的。
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

/**
 * 按字体族缓存度量函数：一页上多枚印章共用一份，同一个字全局只量一次。
 *
 * 只有确认字体到位之后才会走到这里（见 createStampFont），所以缓存里不会混进
 * 「用兜底字体量出来的」结果。
 */
const measurers = new Map<string, GlyphMeasurer>();

export function getGlyphMeasurer(fontFamily: string): GlyphMeasurer {
  const hit = measurers.get(fontFamily);
  if (hit) return hit;
  const measurer = createGlyphMeasurer(fontFamily);
  measurers.set(fontFamily, measurer);
  return measurer;
}

/**
 * 这组字在这个字体族下**现在**就能画吗？同步回答。
 *
 * 直接问浏览器（FontFaceSet.check），不用自己记「哪个字体等过了」：系统字体一律算就绪，
 * 网络字体则要真的下载完才算。问不到（服务端、老浏览器）一律当没就绪，退回兜底比例。
 */
export function isStampFontReady(fontFamily: string, text: string): boolean {
  if (typeof document === "undefined" || !("fonts" in document)) return false;
  try {
    return document.fonts.check(`${PROBE_SIZE}px ${fontFamily}`, text);
  } catch {
    /* 字体名不合法：当没就绪处理 */
    return false;
  }
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

/** 不传印文时拿这几个字当探针：整包（没切子集）的字体，探一个字就会把整份拉下来 */
const PRELOAD_PROBE = "印章水墨";

export interface PreloadStampFontOptions {
  /** 字体族，写法和 CSS 的 font-family 一样；不传就读 :root 上的 --m-font-seal */
  font?: string;
  /**
   * 会用到的印文。字体按 unicode-range 切过子集的话必须传，否则只会拉到探针字所在的那一份。
   */
  text?: string;
}

/**
 * 把印章字体提前拉下来。在应用启动时调一次（`createInkEngine()` 旁边），
 * 等第一枚印章要画时字体已经在，就不会先排一版兜底再跳。
 *
 * 浏览器只在「有元素真的用到某个字体」时才会去下载网络字体，所以光写 @font-face 不够，
 * 得像这样显式要一次。调多次无所谓，第二次是浏览器缓存。
 */
export async function preloadStampFont(options: PreloadStampFontOptions = {}): Promise<void> {
  if (typeof document === "undefined") return;
  const family =
    options.font ??
    getComputedStyle(document.documentElement).getPropertyValue("--m-font-seal").trim();
  if (!family) return;
  await loadStampFont(family, options.text ?? PRELOAD_PROBE);
}
