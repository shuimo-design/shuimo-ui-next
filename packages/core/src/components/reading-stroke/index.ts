/**
 * 一笔书进度的无框架部分：阅读进度 = 随页面滚动写完的一根笔触。
 *
 * 目标解析、滚动监听、进度换算、量视口宽度，全在这里的控制器里；壳只挂 ref、渲染一根条。
 * 笔触按视口实际宽度生成（64px 分桶），当遮罩套在满宽的条上；进度用 clip-path 从左往右揭开——
 * 遮罩本身不动，飞白和边缘的位置在滚动过程中稳定，揭开的是"写到哪了"。
 * 没选 stroke-dashoffset：笔触生成器出的是带飞白的填充墨带，不是可描边的路径，dashoffset 用不上。
 * 支持 mask-composite 的浏览器再叠一层横向渐变，让笔尖那一头化开；不支持的就是直接按进度截宽。
 */
import { brushLineUrl } from "../../ink/assets/line";
import type { Controller } from "../../runtime/controller";
import { isClient } from "../../runtime/dom";
import { observeSize, type SizeBox } from "../../runtime/observe-size";
import { createStore } from "../../runtime/store";
import type { ReadingStrokePosition, ReadingStrokeProps } from "./types";

export type { ReadingStrokeEmits, ReadingStrokePosition, ReadingStrokeProps } from "./types";

/** 进度条的无障碍名，两个壳必须一致 */
export const READING_STROKE_LABEL = "阅读进度";
/** 默认笔宽 px */
export const READING_STROKE_THICKNESS = 4;
/** 默认层级：压在页面内容之上、消息和通知之下 */
export const READING_STROKE_Z_INDEX = 9000;
/** 没传 seed 时的那根笔：固定值，服务端和客户端画的是同一根 */
export const READING_STROKE_SEED = 1;
/** 笔触按 64px 分桶生成，视口宽度小幅变化不重新生成 */
const MASK_BUCKET = 64;

/* ── 纯函数 ──────────────────────────────────────────────────── */

/** 滚动位置 → 0–1 的进度；滚不动的容器算 0 */
export function readingStrokeProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const range = scrollHeight - clientHeight;
  if (range <= 0) return 0;
  return Math.min(1, Math.max(0, scrollTop / range));
}

/** 0–1 → 整数百分点，aria-valuenow 和 change 的触发都按它 */
export function readingStrokePercent(progress: number): number {
  return Math.round(progress * 100);
}

export function readingStrokeClasses(o: {
  position: ReadingStrokePosition;
  /** 量到宽度、笔触遮罩已经生成 */
  masked: boolean;
  progress: number;
}): string[] {
  return [
    "m-reading-stroke",
    `m-reading-stroke--${o.position}`,
    ...(o.masked ? ["m-reading-stroke--masked"] : []),
    ...(o.progress >= 1 ? ["m-reading-stroke--done"] : []),
  ];
}

export interface ReadingStrokeInk {
  seed: number;
  thickness: number;
  /** 视口宽度；量到之前是 0，这时不生成遮罩 */
  width: number;
}

/** 按视口宽度（64px 分桶）生成的笔触；没量到宽度时返回 null */
export function readingStrokeMask(o: ReadingStrokeInk): { url: string; height: number } | null {
  if (o.width <= 0) return null;
  const length = Math.max(MASK_BUCKET, Math.ceil(o.width / MASK_BUCKET) * MASK_BUCKET);
  const line = brushLineUrl({
    seed: o.seed,
    length,
    thickness: o.thickness,
    flyingWhite: 0.2,
    roughness: 0.6,
    // 起笔贴着视口左边，收笔到右边为止；留白按笔宽给晕染余量
    endPad: Math.ceil(o.thickness / 2),
  });
  return { url: line.url, height: line.height };
}

export function readingStrokeStyle(
  o: ReadingStrokeInk & {
    color: string | undefined;
    zIndex: number | undefined;
    progress: number;
  },
): Record<string, string> {
  const mask = readingStrokeMask(o);
  return {
    "--m-reading-stroke-thickness": `${o.thickness}px`,
    "--m-reading-stroke-color": o.color ?? "var(--m-ink)",
    "--m-reading-stroke-z": String(o.zIndex ?? READING_STROKE_Z_INDEX),
    "--m-reading-stroke-progress": o.progress.toFixed(4),
    // 遮罩的画幅高度：条按它撑高，笔触才不会被纵向拉伸
    "--m-reading-stroke-band": mask ? `${mask.height}px` : `${o.thickness}px`,
    "--m-reading-stroke-mask": mask ? `url("${mask.url}")` : "none",
  };
}

/** role / aria：两个壳原样写到根元素上 */
export function readingStrokeAria(progress: number): Record<string, string | number> {
  return {
    role: "progressbar",
    "aria-label": READING_STROKE_LABEL,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": readingStrokePercent(progress),
  };
}

/**
 * 把 target 解析成真正滚动的元素：选择器 → querySelector，元素 → 原样，函数 → 调它，不传 → 整页。
 * 服务端、或者选择器找不到时返回 null，控制器这时什么都不监听。
 */
export function resolveReadingStrokeTarget(
  target: ReadingStrokeProps["target"],
): HTMLElement | null {
  if (!isClient()) return null;
  if (typeof target === "function") return target();
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  if (target) return target;
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** 整页滚动的那个元素：滚动事件不在它身上派发，要挂到 window 上 */
function isPageElement(el: HTMLElement): boolean {
  return (
    el === document.scrollingElement || el === document.documentElement || el === document.body
  );
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface ReadingStrokeOptions {
  target: ReadingStrokeProps["target"];
  /** 进度跨过整数百分点时调一次 */
  onChange?: (progress: number) => void;
}

export interface ReadingStrokeSnapshot {
  /** 0–1 的阅读进度 */
  readonly progress: number;
  /** 条的实际宽度（视口宽度），笔触按它生成；量到之前是 0 */
  readonly width: number;
}

export interface ReadingStrokeController extends Controller<
  ReadingStrokeSnapshot,
  ReadingStrokeOptions
> {
  /** 根元素的 ref 回调：拿到元素才量得到宽度。传 null 就停 */
  attach(el: HTMLElement | null): void;
  /** 当前监听的滚动元素，给测试和 expose 用 */
  element(): HTMLElement | null;
}

/** 服务端算得出来的那份：没滚、没量。引用恒定 */
const SERVER_SNAPSHOT: ReadingStrokeSnapshot = { progress: 0, width: 0 };

export function createReadingStroke(initial: ReadingStrokeOptions): ReadingStrokeController {
  const store = createStore<ReadingStrokeSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let connected = false;
  let root: HTMLElement | null = null;
  let stopSize: (() => void) | undefined;
  /** 当前监听着的滚动元素，以及它是按哪个 target 解析出来的 */
  let el: HTMLElement | null = null;
  let boundTarget: ReadingStrokeProps["target"] = initial.target;
  let stopScroll: (() => void) | undefined;
  /** 上次通知出去的整数百分点：只在跨过时才发 change，不每帧都发 */
  let lastPercent = 0;

  function measure(): void {
    if (!el) return;
    const progress = readingStrokeProgress(el.scrollTop, el.scrollHeight, el.clientHeight);
    store.set({ progress });
    const percent = readingStrokePercent(progress);
    if (percent === lastPercent) return;
    lastPercent = percent;
    options.onChange?.(progress);
  }

  function unbind(): void {
    stopScroll?.();
    stopScroll = undefined;
    el = null;
  }

  function bind(): void {
    unbind();
    if (!connected) return;
    boundTarget = options.target;
    el = resolveReadingStrokeTarget(options.target);
    if (!el) return;
    const host: EventTarget = isPageElement(el) ? window : el;
    host.addEventListener("scroll", measure, { passive: true });
    // 内容高度变了（图片加载、折叠展开）进度也变，窗口尺寸变了同理
    window.addEventListener("resize", measure, { passive: true });
    stopScroll = () => {
      host.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
    measure();
  }

  function onResize(box: SizeBox): void {
    store.set({ width: box.width });
  }

  function startSize(): void {
    if (!connected || !root || stopSize) return;
    stopSize = observeSize(root, onResize, "border-box");
  }

  function stopSizeObserver(): void {
    stopSize?.();
    stopSize = undefined;
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    /**
     * 渲染落地之后：target 换了、或者上次解析时元素还没挂出来（选择器指向同一棵树里
     * 稍后才渲染的容器），重新解析并换监听；否则重量一次进度。
     */
    flush() {
      if (!connected) return;
      if (options.target !== boundTarget || !el) bind();
      else measure();
    },

    connect() {
      if (connected) return;
      connected = true;
      bind();
      startSize();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      unbind();
      stopSizeObserver();
    },

    attach(next) {
      if (next === root) return;
      stopSizeObserver();
      root = next;
      startSize();
    },

    element: () => el,
  };
}
