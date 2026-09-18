/**
 * 走马灯的无框架部分。
 *
 * 纯派生：class、根上的变量（高度、翻页方向、墨点素材）、下标归一化、翻页与键盘的目标下标。
 * 自动播放是一台计时器状态机：什么时候该走、悬停 / 聚焦时停、翻过一张就重新计时、
 * 减弱动效时根本不走 —— 全在 createCarousel 控制器里，两个壳只渲染快照、绑几个按钮。
 *
 * 每次只渲染当前那一张，翻页靠过渡组件的进出场：进来的从翻页方向那一侧滑入、出去的往
 * 另一侧滑出。方向写成根上的 CSS 变量（1 / -1），CSS 里 calc 一下就是位移，
 * 所以服务端只有当前那张、没有任何 transform，客户端首帧和它一样。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { prefersReducedMotion } from "../../runtime/dom";
import type { Controller } from "../../runtime/controller";
import { createStore } from "../../runtime/store";
import { scrollCssSize } from "../scroll";
import type { CarouselArrows, CarouselDirection, CarouselIndicator } from "./types";

export type {
  CarouselArrows,
  CarouselDirection,
  CarouselEmits,
  CarouselIndicator,
  CarouselItem,
  CarouselItemProps,
  CarouselItemSlots,
  CarouselProps,
  CarouselSlots,
} from "./types";

/** 过渡类名前缀，CSS 里写死的就是这套 */
export const CAROUSEL_TRANSITION = "m-carousel-slide";
/** autoplay 传 true 时的间隔 ms */
export const CAROUSEL_AUTOPLAY_INTERVAL = 4000;

/** 无障碍名字，两个壳共用这一份 */
export const CAROUSEL_LABELS = {
  region: "走马灯",
  prev: "上一张",
  next: "下一张",
  dots: "选择幻灯片",
} as const;

/** 翻页方向：1 往后（下一张），-1 往前 */
export type CarouselStepDirection = 1 | -1;

/* ── 纯函数 ─────────────────────────────────────────────────── */

export function carouselClasses(o: {
  direction: CarouselDirection;
  arrows: CarouselArrows;
  indicator: CarouselIndicator;
}): string[] {
  return [
    "m-carousel",
    `m-carousel--${o.direction}`,
    `m-carousel--arrows-${o.arrows}`,
    ...(o.indicator === "none" ? [] : ["m-carousel--dots"]),
  ];
}

/** 每张幻灯片的 class；过渡中出去的那张靠过渡类名定位，这里不区分 */
export function carouselSlideClass(): string {
  return "m-carousel__slide";
}

export function carouselDotClasses(active: boolean): string[] {
  return ["m-carousel__dot", ...(active ? ["m-carousel__dot--active"] : [])];
}

/** 竖向时方向键改用上下 */
export function isVerticalCarousel(direction: CarouselDirection = "horizontal"): boolean {
  return direction === "vertical";
}

/**
 * 根上的变量：高度、翻页方向（CSS 里 calc 出位移）、指示器的墨点素材。
 * 墨点固定 16px 画幅，按 seed 生成，同一个走马灯的所有点共用一张。
 */
export function carouselStyle(o: {
  height?: string | number;
  direction: CarouselStepDirection;
  seed: number;
}): Record<string, string> {
  const style: Record<string, string> = {
    "--m-carousel-dir": String(o.direction),
    "--m-carousel-dot": `url("${inkBlobUrl({ seed: o.seed, size: 16, raggedness: 0.16 })}")`,
  };
  const height = scrollCssSize(o.height);
  if (height !== undefined) style["--m-carousel-h"] = height;
  return style;
}

/** autoplay 归一成毫秒：false / 0 / 负数 = 不播，true = 默认间隔 */
export function carouselInterval(autoplay: boolean | number | undefined): number {
  if (autoplay === true) return CAROUSEL_AUTOPLAY_INTERVAL;
  if (typeof autoplay === "number" && Number.isFinite(autoplay) && autoplay > 0) return autoplay;
  return 0;
}

/** 把 v-model 的值收进 [0, count)：越界、NaN、小数都落到合法下标；没有幻灯片时是 0 */
export function normalizeCarouselIndex(index: number | undefined, count: number): number {
  if (count <= 0 || index === undefined || !Number.isFinite(index)) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor(index)));
}

/**
 * 从 current 往前 / 往后走一张落到哪：loop 时两头接上，不 loop 走不动返回 undefined。
 * 只有一张时永远走不动。
 */
export function carouselStep(o: {
  current: number;
  delta: CarouselStepDirection;
  count: number;
  loop: boolean;
}): number | undefined {
  if (o.count <= 1) return undefined;
  const next = o.current + o.delta;
  if (next >= 0 && next < o.count) return next;
  if (!o.loop) return undefined;
  return ((next % o.count) + o.count) % o.count;
}

/** 箭头是否禁用：不 loop 时到头的那一侧禁掉 */
export function carouselArrowDisabled(o: {
  current: number;
  delta: CarouselStepDirection;
  count: number;
  loop: boolean;
}): boolean {
  return carouselStep(o) === undefined;
}

/**
 * 从 from 翻到 to 的视觉方向：loop 下最后一张到第一张算往后、第一张到最后一张算往前，
 * 其余按下标大小。同一张返回 1（不会真的播过渡）。
 */
export function carouselDirection(
  from: number,
  to: number,
  o: { count: number; loop: boolean },
): CarouselStepDirection {
  if (o.loop && o.count > 1) {
    if (from === o.count - 1 && to === 0) return 1;
    if (from === 0 && to === o.count - 1) return -1;
  }
  return to >= from ? 1 : -1;
}

/**
 * 方向键 / Home / End 要翻到哪一张；这个键不归我们管时返回 undefined，壳据此决定要不要 preventDefault。
 * 到头翻不动（不 loop）时也返回 undefined —— 让页面照常滚。
 */
export function carouselKeyIndex(
  key: string,
  o: { current: number; count: number; loop: boolean; vertical: boolean },
): number | undefined {
  const prevKey = o.vertical ? "ArrowUp" : "ArrowLeft";
  const nextKey = o.vertical ? "ArrowDown" : "ArrowRight";
  switch (key) {
    case prevKey:
      return carouselStep({ current: o.current, delta: -1, count: o.count, loop: o.loop });
    case nextKey:
      return carouselStep({ current: o.current, delta: 1, count: o.count, loop: o.loop });
    case "Home":
      return o.count > 0 ? 0 : undefined;
    case "End":
      return o.count > 0 ? o.count - 1 : undefined;
    default:
      return undefined;
  }
}

/** 幻灯片和指示器的无障碍名 */
export function carouselSlideLabel(index: number, count: number): string {
  return `第 ${index + 1} 张，共 ${count} 张`;
}

export function carouselDotLabel(index: number): string {
  return `第 ${index + 1} 张`;
}

/* ── 控制器：自动播放的计时器 ─────────────────────────────────── */

export interface CarouselOptions {
  /** 幻灯片张数 */
  count: number;
  /** 当前下标（已归一化） */
  current: number;
  /** 自动播放间隔 ms，0 = 不播 */
  interval: number;
  loop: boolean;
  vertical: boolean;
  /** 要翻到 next 了；壳在这里写回 v-model 并发 change */
  onChange: (next: number, previous: number) => void;
}

export interface CarouselSnapshot {
  /** 计时器正在走（没被悬停 / 聚焦按住、也没被减弱动效关掉） */
  readonly playing: boolean;
}

export interface CarouselController extends Controller<CarouselSnapshot, CarouselOptions> {
  /** 根元素的 ref 回调：悬停、焦点进出都挂在它上面 */
  setRoot(el: HTMLElement | null): void;
  goTo(index: number): void;
  prev(): void;
  next(): void;
  /** 挂在根元素的 keydown 上：方向键翻页，Home / End 到两头 */
  onKeyDown(event: KeyboardEvent): void;
}

const SERVER_SNAPSHOT: CarouselSnapshot = { playing: false };

export function createCarousel(initial: CarouselOptions): CarouselController {
  const store = createStore<CarouselSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let connected = false;
  let root: HTMLElement | null = null;
  /** 悬停或焦点在里面时按住不走 */
  let hovered = false;
  let focused = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** 上一次排定计时器时的（间隔、张数、当前张）：三样都没变就不重排，免得无关的重渲染把倒计时清零 */
  let armedFor = "";

  function clear(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    armedFor = "";
    store.set({ playing: false });
  }

  function shouldPlay(): boolean {
    return (
      connected &&
      options.interval > 0 &&
      options.count > 1 &&
      !hovered &&
      !focused &&
      !prefersReducedMotion()
    );
  }

  function goTo(index: number): void {
    const next = normalizeCarouselIndex(index, options.count);
    if (next === options.current || options.count === 0) return;
    options.onChange(next, options.current);
  }

  function tick(): void {
    timer = undefined;
    armedFor = "";
    const next = carouselStep({
      current: options.current,
      delta: 1,
      count: options.count,
      loop: options.loop,
    });
    // 不 loop 且到了最后一张：停下，等用户翻回去再走
    if (next === undefined) {
      store.set({ playing: false });
      return;
    }
    goTo(next);
  }

  /** 该走就排一次计时器；条件不满足就清掉 */
  function schedule(): void {
    if (!shouldPlay()) {
      clear();
      return;
    }
    const key = `${options.interval}:${options.count}:${options.current}`;
    if (timer !== undefined && armedFor === key) return;
    if (timer !== undefined) clearTimeout(timer);
    armedFor = key;
    timer = setTimeout(tick, options.interval);
    store.set({ playing: true });
  }

  function onPointerEnter(): void {
    hovered = true;
    schedule();
  }
  function onPointerLeave(): void {
    hovered = false;
    schedule();
  }
  function onFocusIn(): void {
    focused = true;
    schedule();
  }
  function onFocusOut(event: FocusEvent): void {
    // 焦点还在里面挪（箭头 → 指示器）不算离开
    if (root && event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
    focused = false;
    schedule();
  }

  function bind(el: HTMLElement): void {
    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
  }
  function unbind(el: HTMLElement): void {
    el.removeEventListener("pointerenter", onPointerEnter);
    el.removeEventListener("pointerleave", onPointerLeave);
    el.removeEventListener("focusin", onFocusIn);
    el.removeEventListener("focusout", onFocusOut);
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      // 纯赋值：计时器的重排放在 flush()，渲染落地之后做
      options = next;
    },

    /** 渲染落地之后：当前张 / 间隔 / 张数变了就重新计时，没变就是一次空调用 */
    flush() {
      schedule();
    },

    connect() {
      if (connected) return;
      connected = true;
      schedule();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      clear();
    },

    setRoot(el) {
      if (el === root) return;
      if (root) unbind(root);
      root = el;
      hovered = false;
      focused = false;
      if (el) bind(el);
    },

    goTo,
    prev() {
      const next = carouselStep({
        current: options.current,
        delta: -1,
        count: options.count,
        loop: options.loop,
      });
      if (next !== undefined) goTo(next);
    },
    next() {
      const next = carouselStep({
        current: options.current,
        delta: 1,
        count: options.count,
        loop: options.loop,
      });
      if (next !== undefined) goTo(next);
    },

    onKeyDown(event) {
      const next = carouselKeyIndex(event.key, {
        current: options.current,
        count: options.count,
        loop: options.loop,
        vertical: options.vertical,
      });
      if (next === undefined) return;
      event.preventDefault();
      goTo(next);
    },
  };
}
