/**
 * 笔触边框控制器：监听元素尺寸，按桶生成边框 SVG 并写进 CSS 变量，样式见 stroke.css。
 *
 * 它只有副作用、没有要驱动渲染的状态，所以不实现 Controller 接口，
 * 只提供 attach / update / dispose 三个方法（和 ink/parallax 的 createParallax 一个范式）。
 * Vue 和 React 各包十几行，把 attach 绑成元素的 ref 回调即可。
 */
import { observeSize, type SizeBox } from "../../runtime/observe-size";
import { prefersReducedMotion } from "../../runtime/dom";
import {
  applyBrushBorder,
  brushBorderUrl,
  bucket,
  clearBrushBorder,
  markRevealed,
  staticKey,
  STROKE_ATTR,
} from "./apply";
import type { BrushBorderOptions } from "./generate";

export interface BrushBorderControllerOptions extends BrushBorderOptions {
  /** 关掉时不生成也不打标记；不传则跟随 html.m-ink-ready */
  enabled?: boolean;
  /** 首次落笔沿笔画描出（尺寸变化后的重生成不再播放）。默认 false；开了也跟随 prefers-reduced-motion */
  revealOnMount?: boolean;
}

export interface BrushBorderController {
  /** 元素的 ref 回调：拿到元素就开始画，传 null 就清干净。可以反复调 */
  attach(el: HTMLElement | null): void;
  update(options: BrushBorderControllerOptions): void;
  /** 强制重画（字体加载完、主题切换之后） */
  refresh(): void;
  dispose(): void;
}

function isInkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

export function createBrushBorder(
  initial: BrushBorderControllerOptions = {},
): BrushBorderController {
  let options = initial;
  let el: HTMLElement | null = null;
  let stopSize: (() => void) | undefined;
  let width = 0;
  let height = 0;
  let firstPaint = true;
  /** 上一次落笔用的尺寸桶 + 参数；不变就不重画 */
  let lastKey: string | undefined;
  /** 描出动画播到什么时候；播放期间尺寸变了也先不换图，画完再补静态版（挂载后常有一次尺寸抖动） */
  let revealUntil = 0;
  let pending: ReturnType<typeof setTimeout> | undefined;
  const reducedMotion = prefersReducedMotion();

  function enabled(): boolean {
    return options.enabled ?? isInkReady();
  }

  function draw(): void {
    if (!el) return;
    if (!enabled()) {
      clearBrushBorder(el);
      lastKey = undefined;
      return;
    }
    // 挂载后尺寸监听会瞬间报一次 0×0（隐藏、过渡中也会）：当作抖动忽略，保持现状，不要清掉边框
    if (width === 0 || height === 0) return;
    const { enabled: _enabled, revealOnMount = false, ...generateOptions } = options;
    const seenKey = staticKey(bucket(width), bucket(height), generateOptions);
    if (seenKey === lastKey) return;
    const now = performance.now();
    if (now < revealUntil && el.hasAttribute(STROKE_ATTR)) {
      // 正在描出：mask 按 100% 拉伸能容忍几像素的尺寸变化，等画完再换
      clearTimeout(pending);
      pending = setTimeout(draw, revealUntil - now);
      return;
    }
    lastKey = seenKey;
    const wantReveal = firstPaint && revealOnMount && !reducedMotion && markRevealed(seenKey);
    const reveal = wantReveal ? (options.reveal ?? true) : false;
    if (reveal) {
      const duration =
        typeof reveal === "object" ? (reveal.duration ?? 1200) + (reveal.delay ?? 0) : 1200;
      revealUntil = performance.now() + duration + 100;
    }
    const entry = brushBorderUrl(width, height, { ...generateOptions, reveal });
    firstPaint = false;
    applyBrushBorder(el, entry);
  }

  function onResize(box: SizeBox): void {
    if (box.width === width && box.height === height) return;
    width = box.width;
    height = box.height;
    draw();
  }

  return {
    attach(next) {
      if (next === el) return;
      stopSize?.();
      stopSize = undefined;
      if (el) clearBrushBorder(el);
      el = next;
      // 换了元素就必须重画：尺寸桶一样也不行（v-if 卸载再挂回是新元素）
      lastKey = undefined;
      width = 0;
      height = 0;
      if (!el) return;
      // 先打上标记让普通边框从第一帧就透明，避免"墨色边框渐隐、笔触边框冒出"的闪动；
      // 此时遮罩变量还没有，stroke.css 给了一张空遮罩兜底，不会画出实心块
      if (enabled()) el.setAttribute(STROKE_ATTR, "");
      stopSize = observeSize(el, onResize, "border-box");
    },
    update(next) {
      options = next;
      draw();
    },
    refresh() {
      lastKey = undefined;
      draw();
    },
    dispose() {
      clearTimeout(pending);
      stopSize?.();
      stopSize = undefined;
      if (el) clearBrushBorder(el);
      el = null;
    },
  };
}
