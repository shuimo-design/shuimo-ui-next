/**
 * 自绘滚动条的无框架部分。
 *
 * 纯几何（滑块多长、落在哪、那一笔画成什么样）是纯函数，由壳在渲染期调；
 * 有时序的部分——滚动监听、尺寸监听、滑块拖拽、"滚完 800ms 淡出"的定时器——写成控制器。
 * 元素全部由控制器自己接管（setRoot / setView / setContent / thumbRef），
 * 所以两个壳里一行 addEventListener 都没有。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { isClient } from "../../runtime/dom";
import { observeSize } from "../../runtime/observe-size";
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { ScrollPosition } from "./types";

export type { ScrollEmits, ScrollExpose, ScrollPosition, ScrollProps, ScrollSlots } from "./types";

/** 纵向 / 横向 */
export type ScrollAxis = "v" | "h";

export interface ScrollBar {
  /** 轨道长度 px；0 表示这个方向没有溢出，不画滚动条 */
  readonly track: number;
  /** 滑块长度 px */
  readonly thumb: number;
  /** 滑块距轨道起点的偏移 px */
  readonly offset: number;
}

export interface ScrollSnapshot {
  readonly v: ScrollBar;
  readonly h: ScrollBar;
  /** 正在滚（滚完 800ms 内），滚动条浮现 */
  readonly scrolling: boolean;
  /** 正在拖滑块 */
  readonly dragging: boolean;
}

const EMPTY_BAR: ScrollBar = { track: 0, thumb: 0, offset: 0 };
/**
 * 服务端算得出来的那份：服务端量不到任何尺寸，两个方向都没有滚动条。
 * 引用恒定（模块级常量），useSyncExternalStore 才不会一直重渲染。
 */
const SERVER_SNAPSHOT: ScrollSnapshot = {
  v: EMPTY_BAR,
  h: EMPTY_BAR,
  scrolling: false,
  dragging: false,
};

/** 滚完多久滚动条淡出 */
const IDLE_MS = 800;
/** 滑块墨条的画幅粗细，和 CSS 里的 --m-scroll-line 一个口径 */
const LINE_THICKNESS = 6;
/** 量不到 --m-scroll-size 时的兜底槽位宽度，和 CSS 里的默认值一致 */
const DEFAULT_GUTTER = 10;
/** 滑块长度按这个粒度分桶再生成笔触，拖拽缩放时不至于每帧重画 SVG */
const THUMB_BUCKET = 8;
/** 笔触线最短也要有这么长，不然短滑块那一笔只剩两个墨点 */
const MIN_LINE = 24;

/* ── 纯函数：class / 行内样式 / 几何 ───────────────────────────── */

/** 数字按 px，字符串原样用 */
export function scrollCssSize(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export function scrollClasses(o: {
  always: boolean;
  scrolling: boolean;
  dragging: boolean;
}): string[] {
  return [
    "m-scroll",
    ...(o.always ? ["m-scroll--always"] : []),
    ...(o.scrolling ? ["m-scroll--scrolling"] : []),
    ...(o.dragging ? ["m-scroll--dragging"] : []),
  ];
}

export function scrollViewStyle(o: {
  height?: string | number;
  maxHeight?: string | number;
}): Record<string, string> {
  const style: Record<string, string> = {};
  const height = scrollCssSize(o.height);
  const maxHeight = scrollCssSize(o.maxHeight);
  if (height !== undefined) style.height = height;
  if (maxHeight !== undefined) style.maxHeight = maxHeight;
  return style;
}

/**
 * 一条滚动条的几何：滑块多长、落在轨道的哪个位置。
 * `visible` 为假或轨道没长度时返回同一个空对象——引用恒定，省掉一次无谓的重渲染。
 */
export function scrollBarGeometry(o: {
  visible: boolean;
  /** 轨道长度（已经扣掉另一条滚动条占的角） */
  track: number;
  /** 视口在这个方向的可见长度 */
  client: number;
  /** 内容在这个方向的总长度 */
  scroll: number;
  /** 当前滚动位置 */
  position: number;
  minThumb: number;
}): ScrollBar {
  if (!o.visible || o.track <= 0 || o.scroll <= 0) return EMPTY_BAR;
  const thumb = Math.min(o.track, Math.max(o.minThumb, (o.track * o.client) / o.scroll));
  const range = o.scroll - o.client;
  return {
    track: o.track,
    thumb,
    offset: range > 0 ? (o.position / range) * (o.track - thumb) : 0,
  };
}

/**
 * 一条滚动条的全部 CSS 变量。滑块那一笔按实际长度单独生成（长度分桶），
 * 不拿通用线横向硬压——横着压出来的飞白方向是错的。
 */
export function scrollBarStyle(bar: ScrollBar, axis: ScrollAxis): Record<string, string> {
  const bucket = Math.max(MIN_LINE, Math.ceil(bar.thumb / THUMB_BUCKET) * THUMB_BUCKET);
  const line = brushLineUrl({
    seed: axis === "v" ? 11 : 12,
    length: bucket,
    thickness: LINE_THICKNESS,
    vertical: axis === "v",
  });
  const band = axis === "v" ? line.width : line.height;
  return {
    "--m-scroll-track": `${bar.track}px`,
    "--m-scroll-thumb-length": `${bar.thumb}px`,
    "--m-scroll-thumb-offset": `${bar.offset}px`,
    "--m-scroll-thumb-mask": `url("${line.url}")`,
    "--m-scroll-band": `${band}px`,
  };
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface ScrollOptions {
  /** 滑块最短长度 px */
  minThumb: number;
  /** 视口滚动时回调 */
  onScroll?: (position: ScrollPosition) => void;
}

export interface ScrollController extends Controller<ScrollSnapshot, ScrollOptions> {
  /** 根元素的 ref 回调：只用来读 --m-scroll-size */
  setRoot(el: HTMLElement | null): void;
  /** 真正滚动的视口元素的 ref 回调 */
  setView(el: HTMLElement | null): void;
  /** 内容层的 ref 回调：横向溢出时靠它量出内容宽度 */
  setContent(el: HTMLElement | null): void;
  /** 某条滑块的元素；Vue 那边由 watchEffect 在 flush: "post" 里交过来 */
  setThumb(axis: ScrollAxis, el: HTMLElement | null): void;
  /** 某条滑块的 ref 回调，给 React 用；同一个 axis 每次返回同一个函数，ref 身份才稳 */
  thumbRef(axis: ScrollAxis): (el: HTMLElement | null) => void;
  /** 重新量一遍两条滚动条 */
  measure(): void;
  scrollTo(options: ScrollToOptions): void;
  /** 视口元素，给 expose 用 */
  view(): HTMLElement | null;
}

export function createScroll(initial: ScrollOptions): ScrollController {
  const store = createStore<ScrollSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let connected = false;

  let root: HTMLElement | null = null;
  let viewEl: HTMLElement | null = null;
  let contentEl: HTMLElement | null = null;
  const thumbs: Record<ScrollAxis, HTMLElement | null> = { v: null, h: null };

  let stopView: (() => void) | undefined;
  let stopContent: (() => void) | undefined;
  const stopThumb: Record<ScrollAxis, (() => void) | undefined> = { v: undefined, h: undefined };
  let stopDrag: (() => void) | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  /** 滚动条槽位宽度：从 CSS 变量读，用户覆盖 --m-scroll-size 时布局跟着走 */
  function gutter(): number {
    if (!root || !isClient()) return DEFAULT_GUTTER;
    const raw = Number.parseFloat(getComputedStyle(root).getPropertyValue("--m-scroll-size"));
    return Number.isFinite(raw) ? raw : DEFAULT_GUTTER;
  }

  /** 三个字段都没变就沿用旧对象，省掉 store 的一次通知 */
  function keep(prev: ScrollBar, next: ScrollBar): ScrollBar {
    return prev.track === next.track && prev.thumb === next.thumb && prev.offset === next.offset
      ? prev
      : next;
  }

  function measure(): void {
    const el = viewEl;
    if (!el) return;
    const { clientWidth, clientHeight, scrollWidth, scrollHeight, scrollTop, scrollLeft } = el;
    // 差 1px 以内算没溢出，免得子像素误差让滚动条闪出来
    const hasV = scrollHeight > clientHeight + 1;
    const hasH = scrollWidth > clientWidth + 1;
    const size = gutter();
    const snapshot = store.get();
    store.set({
      v: keep(
        snapshot.v,
        scrollBarGeometry({
          visible: hasV,
          track: clientHeight - (hasH ? size : 0),
          client: clientHeight,
          scroll: scrollHeight,
          position: scrollTop,
          minThumb: options.minThumb,
        }),
      ),
      h: keep(
        snapshot.h,
        scrollBarGeometry({
          visible: hasH,
          track: clientWidth - (hasV ? size : 0),
          client: clientWidth,
          scroll: scrollWidth,
          position: scrollLeft,
          minThumb: options.minThumb,
        }),
      ),
    });
  }

  function onScroll(): void {
    const el = viewEl;
    if (!el) return;
    measure();
    options.onScroll?.({ scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });
    store.set({ scrolling: true });
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = undefined;
      store.set({ scrolling: false });
    }, IDLE_MS);
  }

  /** 滚动条盖在视口上，滚轮落在滑块上时把滚动量转给视口 */
  function onThumbWheel(event: WheelEvent): void {
    event.preventDefault();
    viewEl?.scrollBy({ left: event.deltaX, top: event.deltaY });
  }

  function startDrag(axis: ScrollAxis, event: PointerEvent): void {
    const el = viewEl;
    if (!el || event.button !== 0) return;
    event.preventDefault();
    stopDrag?.();
    const bar = store.get()[axis];
    const vertical = axis === "v";
    const start = vertical ? event.clientY : event.clientX;
    const startScroll = vertical ? el.scrollTop : el.scrollLeft;
    const range = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const free = bar.track - bar.thumb;
    // 指针每挪 1px，内容要滚多少 px
    const ratio = free > 0 ? range / free : 0;
    store.set({ dragging: true });

    const move = (ev: PointerEvent): void => {
      const delta = (vertical ? ev.clientY : ev.clientX) - start;
      if (vertical) el.scrollTop = startScroll + delta * ratio;
      else el.scrollLeft = startScroll + delta * ratio;
    };
    const stop = (): void => {
      store.set({ dragging: false });
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      stopDrag = undefined;
    };
    // 监听挂在 window 上：指针滑出滑块甚至滑出组件也不丢
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    stopDrag = stop;
  }

  /* ── 元素接线：connect 之后才真的装监听，元素换了就重装 ─────── */

  function bindView(): void {
    stopView?.();
    stopView = undefined;
    const el = viewEl;
    if (!connected || !el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    const stopSize = observeSize(el, measure);
    stopView = () => {
      el.removeEventListener("scroll", onScroll);
      stopSize();
    };
  }

  function bindContent(): void {
    stopContent?.();
    stopContent = undefined;
    const el = contentEl;
    if (!connected || !el) return;
    stopContent = observeSize(el, measure);
  }

  function bindThumb(axis: ScrollAxis): void {
    stopThumb[axis]?.();
    stopThumb[axis] = undefined;
    const el = thumbs[axis];
    if (!connected || !el) return;
    const down = (event: PointerEvent): void => startDrag(axis, event);
    el.addEventListener("pointerdown", down);
    // 必须非被动，不然 preventDefault 不生效、页面会跟着一起滚
    el.addEventListener("wheel", onThumbWheel, { passive: false });
    stopThumb[axis] = () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("wheel", onThumbWheel);
    };
  }

  function setThumb(axis: ScrollAxis, el: HTMLElement | null): void {
    if (thumbs[axis] === el) return;
    thumbs[axis] = el;
    bindThumb(axis);
  }

  // 每个 axis 只造一次回调：React 那边 ref 身份变了会先 ref(null) 再 ref(node)，白白重装一遍
  const thumbRefs: Record<ScrollAxis, (el: HTMLElement | null) => void> = {
    v: (el) => setThumb("v", el),
    h: (el) => setThumb("h", el),
  };

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    connect() {
      if (connected) return;
      connected = true;
      bindView();
      bindContent();
      bindThumb("v");
      bindThumb("h");
      // observeSize 建立观察时就同步回调一次，这里再补一次是为了没有内容层的极端情况
      measure();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      stopView?.();
      stopView = undefined;
      stopContent?.();
      stopContent = undefined;
      bindThumb("v");
      bindThumb("h");
      stopDrag?.();
      clearTimeout(idleTimer);
      idleTimer = undefined;
      store.set({ scrolling: false, dragging: false });
    },

    setRoot(el) {
      root = el;
    },
    setView(el) {
      if (viewEl === el) return;
      viewEl = el;
      bindView();
    },
    setContent(el) {
      if (contentEl === el) return;
      contentEl = el;
      bindContent();
    },
    setThumb,
    thumbRef: (axis) => thumbRefs[axis],

    measure,
    scrollTo(o) {
      viewEl?.scrollTo(o);
    },
    view: () => viewEl,
  };
}
