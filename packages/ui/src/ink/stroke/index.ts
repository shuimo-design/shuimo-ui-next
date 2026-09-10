import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";
import { useElementSize } from "@vueuse/core";
import { applyInkVar } from "../registry";
import { generateBrushBorder, svgToDataUrl, type BrushBorderOptions } from "./generate";
import "./stroke.css";

export {
  generateBrushBorder,
  svgToDataUrl,
  type BrushBorder,
  type BrushBorderOptions,
} from "./generate";

export const STROKE_ATTR = "data-ink-stroke";
/** 尺寸按 8px 分桶，同桶复用同一张边框 */
const BUCKET = 8;
const CACHE_LIMIT = 200;
const cache = new Map<string, { url: string; padding: number }>();
/** 已经描出过一次的边框（按尺寸桶 + 参数），再出现时直接落墨，不重播描出动画 */
const revealed = new Set<string>();

function bucket(value: number): number {
  return Math.max(BUCKET, Math.ceil(value / BUCKET) * BUCKET);
}

function staticKey(w: number, h: number, options: BrushBorderOptions): string {
  return `${w}x${h}:${options.seed ?? 1}:${options.strokeWidth ?? 3}:${options.roughness ?? ""}:${options.flyingWhite ?? ""}:${JSON.stringify(options.bleed ?? true)}:${JSON.stringify(options.sides ?? "")}:${JSON.stringify(options.cornerGap ?? 0)}:${options.specks ?? 0}`;
}

/** 生成（或从缓存取）一张 width×height 的笔触边框，返回 CSS url() 可用的 data URL */
export function brushBorderUrl(
  width: number,
  height: number,
  options: BrushBorderOptions = {},
): { url: string; padding: number } {
  const w = bucket(width);
  const h = bucket(height);
  const key = `${staticKey(w, h, options)}:${JSON.stringify(options.reveal ?? false)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const border = generateBrushBorder(w, h, options);
  const entry = { url: svgToDataUrl(border.svg), padding: border.padding };
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, entry);
  return entry;
}

/** 边框图走素材登记（同尺寸的元素共用一条样式规则），外扩距离很短、直接内联 */
export function applyBrushBorder(el: HTMLElement, entry: { url: string; padding: number }) {
  applyInkVar(el, "--m-ink-stroke-border", entry.url);
  el.style.setProperty("--m-ink-stroke-pad", `${entry.padding}px`);
  el.setAttribute(STROKE_ATTR, "");
}

export function clearBrushBorder(el: HTMLElement) {
  applyInkVar(el, "--m-ink-stroke-border", null);
  el.style.removeProperty("--m-ink-stroke-pad");
  el.removeAttribute(STROKE_ATTR);
}

export interface UseBrushBorderOptions extends BrushBorderOptions {
  /** 关掉时不生成也不打标记；默认跟随 html.m-ink-ready */
  enabled?: Ref<boolean> | boolean;
  /** 首次落笔沿笔画描出（尺寸变化后的重生成不再播放）。默认 false，边框直接静态落上；开了也跟随 prefers-reduced-motion */
  revealOnMount?: boolean;
}

function isInkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

/**
 * 给元素挂笔触边框：监听尺寸，按桶生成并写入 CSS 变量，样式见 stroke.css。
 * 只在客户端 onMounted 后工作，SSR 安全。
 */
export function useBrushBorder(
  target: Ref<HTMLElement | null>,
  options: UseBrushBorderOptions = {},
) {
  // 量 border-box：边框要套在 padding 和 border 之外，量内容盒会把 SVG 按小一圈生成再拉伸变形
  const { width, height } = useElementSize(target, undefined, { box: "border-box" });
  let firstPaint = true;
  /** 上一次落笔用的尺寸桶 + 参数；不变就不重画 */
  let lastKey: string | undefined;
  /** 上一次落笔的元素；v-if 卸载再挂回是新元素，尺寸桶一样也得重画 */
  let lastEl: HTMLElement | undefined;
  /** 描出动画播到什么时候；播放期间尺寸变了也先不换图，画完再补静态版（挂载后常有一次尺寸抖动） */
  let revealUntil = 0;
  let pending: ReturnType<typeof setTimeout> | undefined;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  function enabled(): boolean {
    const flag = options.enabled;
    if (flag === undefined) return isInkReady();
    return typeof flag === "boolean" ? flag : flag.value;
  }

  function update() {
    const el = target.value;
    if (!el) return;
    if (el !== lastEl) {
      lastEl = el;
      lastKey = undefined;
      if (enabled()) el.setAttribute(STROKE_ATTR, "");
    }
    if (!enabled()) {
      clearBrushBorder(el);
      lastKey = undefined;
      return;
    }
    // 挂载后尺寸监听会瞬间报一次 0×0（隐藏、过渡中也会）：当作抖动忽略，保持现状，不要清掉边框
    if (width.value === 0 || height.value === 0) return;
    const { enabled: _enabled, revealOnMount = false, ...generateOptions } = options;
    // 同一尺寸、同一参数的边框只描出一次：列表页来回切换时不至于满屏重画
    const seenKey = staticKey(bucket(width.value), bucket(height.value), generateOptions);
    if (seenKey === lastKey) return;
    const now = performance.now();
    if (now < revealUntil && el.hasAttribute(STROKE_ATTR)) {
      // 正在描出：mask 按 100% 拉伸能容忍几像素的尺寸变化，等画完再换
      clearTimeout(pending);
      pending = setTimeout(update, revealUntil - now);
      return;
    }
    lastKey = seenKey;
    const reveal =
      firstPaint && revealOnMount && !reducedMotion && !revealed.has(seenKey)
        ? (options.reveal ?? true)
        : false;
    if (reveal) {
      revealed.add(seenKey);
      const duration =
        typeof reveal === "object" ? (reveal.duration ?? 1200) + (reveal.delay ?? 0) : 1200;
      revealUntil = performance.now() + duration + 100;
    }
    const entry = brushBorderUrl(width.value, height.value, { ...generateOptions, reveal });
    firstPaint = false;
    applyBrushBorder(el, entry);
  }

  onMounted(() => {
    // 先打上标记让普通边框从第一帧就透明，避免"墨色边框渐隐、笔触边框冒出"的闪动；
    // 此时遮罩变量还没有，stroke.css 给了一张空遮罩兜底，不会画出实心块
    if (enabled() && target.value) target.value.setAttribute(STROKE_ATTR, "");
    watch(
      [
        width,
        height,
        target,
        () => (typeof options.enabled === "object" ? options.enabled.value : null),
      ],
      update,
      { immediate: true, flush: "post" },
    );
  });
  onBeforeUnmount(() => {
    clearTimeout(pending);
    if (target.value) clearBrushBorder(target.value);
  });

  return { update };
}
