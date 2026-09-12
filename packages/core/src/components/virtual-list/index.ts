/**
 * 虚拟列表的无框架部分。
 *
 * 分两半：
 * - **纯函数**：前缀和、二分找可视区间、行内样式。由壳在渲染期调（Vue 的 computed / React 的 useMemo），
 *   所以列表数据一变就立刻重算，不用等控制器通知。
 * - **控制器**：滚动位置、视口尺寸、变高模式下量到的行高，以及量完之后的滚动补偿。
 *   这些都是"要有 DOM 才知道"的东西，服务端一律是 0 / 空。
 *
 * 服务端渲染的确定性：量不到视口高度时按 FALLBACK_VIEWPORT_HEIGHT 算，量不到行高时按估算值算，
 * 所以服务端和客户端首帧渲染的是同样的那几行，水合不会对不上。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import { isClient } from "../../runtime/dom";
import { observeSize } from "../../runtime/observe-size";
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { VirtualListAlign } from "./types";

export type {
  VirtualListAlign,
  VirtualListEmits,
  VirtualListExpose,
  VirtualListProps,
  VirtualListScope,
  VirtualListSlots,
} from "./types";

/** 还没量到视口高度时按这个高度算可视区间。服务端和客户端首帧都用它，两边才渲染得一样 */
export const FALLBACK_VIEWPORT_HEIGHT = 300;
/** 分隔线那一笔的种子 */
const LINE_SEED = 5;
/** 分隔线长度按这个粒度分桶：同一桶的列表共用一张图 */
const WIDTH_BUCKET = 32;

/** 下标 → 量到的行高 px；没量过的行不在表里 */
export type VirtualListMeasured = ReadonlyMap<number, number>;

const EMPTY_MEASURED: VirtualListMeasured = new Map<number, number>();

/* ── 纯函数 ───────────────────────────────────────────────────── */

export interface VirtualListMetrics {
  /** 每项固定高度；传了就走定高模式，不查量到的表 */
  itemHeight?: number;
  /** 没量过的项先按这个高度估 */
  estimatedItemHeight: number;
  measured: VirtualListMeasured;
}

/** 第 index 项现在按多高算 */
export function virtualListItemHeight(index: number, m: VirtualListMetrics): number {
  if (m.itemHeight !== undefined) return m.itemHeight;
  return m.measured.get(index) ?? m.estimatedItemHeight;
}

/**
 * 前缀和：返回长度 count+1 的数组，`offsets[i]` 是第 i 项的顶边，`offsets[count]` 是总高。
 * 这个数组只跟行高有关，跟滚到哪没关系，所以壳那边可以单独缓存，滚动时不重算。
 */
export function virtualListOffsets(o: VirtualListMetrics & { count: number }): number[] {
  const result: number[] = [0];
  if (o.itemHeight !== undefined) {
    for (let i = 0; i < o.count; i++) result.push((i + 1) * o.itemHeight);
  } else {
    for (let i = 0; i < o.count; i++) {
      result.push(result[i]! + (o.measured.get(i) ?? o.estimatedItemHeight));
    }
  }
  return result;
}

export function virtualListTotalHeight(offsets: number[], count: number): number {
  return offsets[count] ?? 0;
}

/** 顶边 ≤ top 的最后一项 */
export function virtualListIndexAt(offsets: number[], count: number, top: number): number {
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid]! <= top) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export interface VirtualListRange {
  /** 要渲染的区间 [start, end) */
  readonly start: number;
  readonly end: number;
}

const EMPTY_RANGE: VirtualListRange = { start: 0, end: 0 };

/** 可视区间，含上下各 buffer 项缓冲 */
export function virtualListRange(o: {
  offsets: number[];
  count: number;
  scrollTop: number;
  /** 量到的视口高度；0 表示还没量到，按 FALLBACK_VIEWPORT_HEIGHT 算 */
  viewportHeight: number;
  buffer: number;
}): VirtualListRange {
  if (o.count === 0) return EMPTY_RANGE;
  const vh = o.viewportHeight || FALLBACK_VIEWPORT_HEIGHT;
  const first = virtualListIndexAt(o.offsets, o.count, o.scrollTop);
  let last = first;
  while (last < o.count - 1 && o.offsets[last + 1]! < o.scrollTop + vh) last++;
  return {
    start: Math.max(0, first - o.buffer),
    end: Math.min(o.count, last + 1 + o.buffer),
  };
}

export function virtualListClasses(divider: boolean): string[] {
  return ["m-virtual-list", ...(divider ? ["m-virtual-list--divider"] : [])];
}

/** 占位层：撑出总高度让原生滚动条的长度是对的 */
export function virtualListPhantomStyle(totalHeight: number): Record<string, string> {
  return { height: `${totalHeight}px` };
}

/** 可见的那批项整体平移到位 */
export function virtualListBodyStyle(offsets: number[], start: number): Record<string, string> {
  return { transform: `translateY(${offsets[start] ?? 0}px)` };
}

/** 每一项的 key：没给 itemKey 就按下标 */
export function virtualListKey<T>(
  item: T,
  index: number,
  itemKey?: (item: T, index: number) => PropertyKey,
): PropertyKey {
  return itemKey ? itemKey(item, index) : index;
}

/** 定高模式把高度写死在行内，变高模式不写 */
export function virtualListItemStyle(itemHeight: number | undefined): Record<string, string> {
  return itemHeight === undefined ? {} : { height: `${itemHeight}px` };
}

export interface VirtualListInk extends InkVarBindings {
  style: Record<string, string>;
}

/**
 * 根元素上的变量与素材属性。
 *
 * 分隔线是一根按列表实际宽度生成的细笔触线（宽度按 32px 分桶，所有项共用同一张，m.ink 层拿它当遮罩）；
 * 量到宽度前不给变量，CSS 里回落到通用横线。
 * 线走素材登记：同宽度桶的列表共用样式表里的一条规则，元素上只挂属性；登记不了（服务端 / 水合首帧）才内联。
 */
export function virtualListInk(o: {
  divider: boolean;
  /** 量到的视口宽度，0 表示还没量到 */
  width: number;
  height?: number | string;
  registered: boolean;
}): VirtualListInk {
  const line =
    o.divider && o.width > 0
      ? brushLineUrl({
          seed: LINE_SEED,
          length: Math.max(WIDTH_BUCKET, Math.ceil(o.width / WIDTH_BUCKET) * WIDTH_BUCKET),
          thickness: 1.5,
          roughness: 0.4,
        })
      : undefined;
  const bindings = inkVarBindings({ "--m-virtual-list-line": line?.url }, o.registered);
  const style: Record<string, string> = { ...bindings.style };
  if (o.height !== undefined) {
    style["--m-virtual-list-h"] = typeof o.height === "number" ? `${o.height}px` : o.height;
  }
  if (line) style["--m-virtual-list-line-band"] = `${line.height}px`;
  return { attrs: bindings.attrs, style };
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface VirtualListOptions {
  itemHeight?: number;
  estimatedItemHeight: number;
  buffer: number;
  /** 滚动时回调，参数是 scrollTop */
  onScroll?: (top: number) => void;
  /** 滚到底时回调，同一次触底只报一次 */
  onReachBottom?: () => void;
}

export interface VirtualListSnapshot {
  readonly scrollTop: number;
  /** 量到的视口高度，服务端和首帧是 0 */
  readonly viewportHeight: number;
  /** 量到的视口宽度，分隔线按它生成 */
  readonly viewportWidth: number;
  /**
   * 量到的行高表变一次就 +1。Map 本身一直是同一个对象（量尺寸太频繁，复制不起），
   * 靠这个数当"变了"的信号，壳那边用它做 memo 的依赖。
   */
  readonly version: number;
  readonly measured: VirtualListMeasured;
}

const SERVER_SNAPSHOT: VirtualListSnapshot = {
  scrollTop: 0,
  viewportHeight: 0,
  viewportWidth: 0,
  version: 0,
  measured: EMPTY_MEASURED,
};

export interface VirtualListController extends Controller<VirtualListSnapshot, VirtualListOptions> {
  /** 视口（也是根元素）的 ref 回调 */
  setViewport(el: HTMLElement | null): void;
  /** 数据变了由壳在 effect 里调：整批换掉就把量过的行高丢掉，只是追加则留着 */
  setItems(items: readonly unknown[]): void;
  /** 一项挂上来了（Vue 的指令 mounted 调）。行号从元素的 data-index 上现读，元素会被复用给别的行 */
  observeItem(el: HTMLElement): void;
  /** 一项下线了（Vue 的指令 beforeUnmount 调） */
  releaseItem(el: HTMLElement): void;
  /**
   * 每一项的 ref 回调，给 React 用：身份恒定，返回的清理函数由 React 在卸载时调。
   * 返回了清理函数，React 就不会再拿 null 调一次——正好对上 Vue 那边 mounted / beforeUnmount 的两步。
   */
  measureRef(el: HTMLElement | null): (() => void) | undefined;
  scrollTo(index: number, align?: VirtualListAlign): void;
  scrollToOffset(top: number): void;
  scrollTop(): number;
}

export function createVirtualList(initial: VirtualListOptions): VirtualListController {
  const store = createStore<VirtualListSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let connected = false;

  let viewportEl: HTMLElement | null = null;
  let stopViewport: (() => void) | undefined;

  let items: readonly unknown[] = [];
  /** 变高模式下量到的行高，下标 → px。一直是同一个 Map，靠 version 通知变化 */
  const measured = new Map<number, number>();
  let version = 0;
  /** 到底只报一次，离开底部再回来才再报 */
  let atBottom = false;

  /* 量尺寸的观察：新挂上的项攒到下一帧再观察，消失的项下一帧统一撤掉。
     量尺寸的回调里会改状态、重渲染；在同一轮里观察新节点或让已观察的节点被移除，
     浏览器都会报 "ResizeObserver loop completed with undelivered notifications"。 */
  const observed = new Map<HTMLElement, () => void>();
  const pending = new Set<HTMLElement>();
  let frame: number | undefined;

  /* 一批测量结果攒到微任务里一起提交：补偿量要按"这批开始之前"的布局算 */
  let commitScheduled = false;
  let batchChanged = false;
  let batchShift = 0;
  let batchStart = 0;
  let batchFirst = 0;

  /* 前缀和只跟行高有关，按 count + 行高参数 + version 缓存，滚动时不重算 */
  let offsetsKey = "";
  let offsetsCache: number[] = [0];

  function metrics(): VirtualListMetrics {
    return {
      itemHeight: options.itemHeight,
      estimatedItemHeight: options.estimatedItemHeight,
      measured,
    };
  }

  function offsets(): number[] {
    const key = `${items.length}|${options.itemHeight ?? ""}|${options.estimatedItemHeight}|${version}`;
    if (key !== offsetsKey) {
      offsetsKey = key;
      offsetsCache = virtualListOffsets({ ...metrics(), count: items.length });
    }
    return offsetsCache;
  }

  function range(): VirtualListRange {
    return virtualListRange({
      offsets: offsets(),
      count: items.length,
      scrollTop: store.get().scrollTop,
      viewportHeight: store.get().viewportHeight,
      buffer: options.buffer,
    });
  }

  function bumpVersion(): void {
    version++;
    store.set({ version, measured });
  }

  /* ── 滚动 ─────────────────────────────────────────────────── */

  function checkBottom(): void {
    const el = viewportEl;
    if (!el || items.length === 0) return;
    const reached = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    if (reached && !atBottom) options.onReachBottom?.();
    atBottom = reached;
  }

  function onScroll(): void {
    const el = viewportEl;
    if (!el) return;
    store.set({ scrollTop: el.scrollTop });
    options.onScroll?.(el.scrollTop);
    checkBottom();
  }

  /* ── 量每一项 ─────────────────────────────────────────────── */

  function onItemSize(el: HTMLElement, size: number): void {
    if (options.itemHeight !== undefined || size <= 0) return;
    // 行号现读：同一个 DOM 元素会被复用给别的行，观察时捕获的行号会过期
    const index = Number(el.dataset.index);
    if (!Number.isFinite(index)) return;
    const prev = measured.get(index);
    if (prev === size) return;
    if (!commitScheduled) {
      commitScheduled = true;
      const list = offsets();
      batchStart = range().start;
      batchFirst = virtualListIndexAt(list, items.length, store.get().scrollTop);
      batchShift = 0;
      batchChanged = false;
      queueMicrotask(commitMeasure);
    }
    measured.set(index, size);
    batchChanged = true;
    // 可视区上方的项变高变矮会把内容顶着走，按差值补 scrollTop，让眼前的内容不跳
    if (index >= batchStart && index < batchFirst) {
      batchShift += size - (prev ?? options.estimatedItemHeight);
    }
  }

  function commitMeasure(): void {
    commitScheduled = false;
    if (!batchChanged) return;
    batchChanged = false;
    const shift = batchShift;
    batchShift = 0;
    bumpVersion();
    if (shift !== 0 && viewportEl) viewportEl.scrollTop += shift;
  }

  function schedule(): void {
    if (frame !== undefined || !isClient()) return;
    frame = requestAnimationFrame(flushObserve);
  }

  function flushObserve(): void {
    frame = undefined;
    for (const el of pending) {
      if (observed.has(el)) continue;
      observed.set(
        el,
        observeSize(el, (box) => onItemSize(el, box.height), "border-box"),
      );
    }
    pending.clear();
  }

  function observeItem(el: HTMLElement): void {
    if (options.itemHeight !== undefined) return;
    pending.add(el);
    schedule();
  }

  function releaseItem(el: HTMLElement): void {
    pending.delete(el);
    const stop = observed.get(el);
    if (!stop) return;
    stop();
    observed.delete(el);
  }

  function stopObserving(): void {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    pending.clear();
    for (const stop of observed.values()) stop();
    observed.clear();
  }

  /* ── 视口接线 ─────────────────────────────────────────────── */

  function bindViewport(): void {
    stopViewport?.();
    stopViewport = undefined;
    const el = viewportEl;
    if (!connected || !el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    const stopSize = observeSize(el, (box) =>
      store.set({ viewportWidth: box.width, viewportHeight: box.height }),
    );
    stopViewport = () => {
      el.removeEventListener("scroll", onScroll);
      stopSize();
    };
  }

  /* ── 对外方法 ─────────────────────────────────────────────── */

  function targetTop(index: number, align: Exclude<VirtualListAlign, "auto">): number {
    const top = offsets()[index] ?? 0;
    const size = virtualListItemHeight(index, metrics());
    const vh = viewportEl?.clientHeight ?? 0;
    switch (align) {
      case "start":
        return top;
      case "center":
        return top - (vh - size) / 2;
      default:
        return top + size - vh;
    }
  }

  function scrollToOffset(top: number): void {
    const el = viewportEl;
    if (!el) return;
    el.scrollTop = Math.max(0, top);
    // scroll 事件是异步的，先把状态对上，调用方等一帧后就能拿到新的一批项
    store.set({ scrollTop: el.scrollTop });
  }

  function scrollTo(index: number, align: VirtualListAlign = "auto"): void {
    const el = viewportEl;
    const count = items.length;
    if (!el || count === 0) return;
    const target = Math.max(0, Math.min(count - 1, Math.floor(index)));
    let effective: Exclude<VirtualListAlign, "auto"> = align === "auto" ? "start" : align;
    if (align === "auto") {
      // 已经整个在可视区里就不动；在上面就贴顶，在下面就贴底
      const top = offsets()[target] ?? 0;
      const size = virtualListItemHeight(target, metrics());
      if (top >= el.scrollTop && top + size <= el.scrollTop + el.clientHeight) return;
      effective = top < el.scrollTop ? "start" : "end";
    }
    const go = (): void => {
      const top = targetTop(target, effective);
      if (Math.abs(top - (viewportEl?.scrollTop ?? 0)) > 1) scrollToOffset(top);
    };
    go();
    // 变高模式：滚过去之后那一批项才被量到（观察推迟了一帧），位置会挪，接着几帧再校正
    if (options.itemHeight === undefined && isClient()) {
      let rounds = 3;
      const settle = (): void => {
        go();
        if (--rounds > 0) requestAnimationFrame(settle);
      };
      requestAnimationFrame(settle);
    }
  }

  // 身份恒定：React 那边 ref 变了会先 ref(null) 再 ref(node)，白白重量一遍
  function measureRef(el: HTMLElement | null): (() => void) | undefined {
    if (!el) return undefined;
    observeItem(el);
    return () => releaseItem(el);
  }

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
      bindViewport();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      stopViewport?.();
      stopViewport = undefined;
      stopObserving();
    },

    setViewport(el) {
      viewportEl = el;
      bindViewport();
    },

    setItems(next) {
      const prev = items;
      items = next;
      // 只是往后追加就留着量过的高度；整批换掉（或删了几行）就全部作废
      const appended = next.length >= prev.length && prev.every((value, i) => value === next[i]);
      if (appended) return;
      measured.clear();
      atBottom = false;
      bumpVersion();
    },

    observeItem,
    releaseItem,
    measureRef,

    scrollTo,
    scrollToOffset,
    scrollTop: () => viewportEl?.scrollTop ?? 0,
  };
}
