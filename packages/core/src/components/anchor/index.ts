/**
 * 锚点导航的无框架部分。
 *
 * 纯派生：把嵌套的 items 铺平成带层级的一列、class / 变量、"哪个锚点该激活"的判定、指示线的几何。
 * 有 DOM 的部分全在 createAnchor 控制器里：解析滚动容器、监听滚动、量每个目标离容器顶边多远、
 * 点击后滚过去并在滚动途中锁住判定（否则激活项会一路跳过中间的锚点）、量激活项的位置给指示线。
 * 两个壳只渲染 <nav> + <a>，把 nav 元素交给控制器。
 */
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import { isClient, prefersReducedMotion } from "../../runtime/dom";
import { observeSize } from "../../runtime/observe-size";
import type { BrushLineControllerOptions } from "../divider";
import type { AnchorContainer, AnchorDirection, AnchorItem } from "./types";

export type {
  AnchorContainer,
  AnchorDirection,
  AnchorEmits,
  AnchorItem,
  AnchorItemScope,
  AnchorProps,
  AnchorSlots,
} from "./types";

/** <nav> 的无障碍名，两个壳一致 */
export const ANCHOR_LABEL = "锚点导航";
/** 指示线笔触的默认种子 */
const SEED = 1;
/**
 * 点击后的滚动锁：最后一次 scroll 事件之后再静默这么久才解锁。
 * 平滑滚动一路派发 scroll，锁一直续着；目标本来就在视口里（一次 scroll 都没有）也能按时解开。
 */
const SCROLL_SETTLE_MS = 150;
/** 判定"越过顶边"时的容差 px：浏览器把滚动位置对齐到目标时常差不到 1px */
const EDGE_TOLERANCE = 1;

/* ── 纯函数 ─────────────────────────────────────────────────── */

export function isHorizontalAnchor(direction: AnchorDirection = "vertical"): boolean {
  return direction === "horizontal";
}

export function anchorClasses(o: { direction: AnchorDirection; affix: boolean }): string[] {
  return ["m-anchor", `m-anchor--${o.direction}`, ...(o.affix ? ["m-anchor--affix"] : [])];
}

/** 吸顶时 sticky 的 top 走变量，CSS 里引用它 */
export function anchorStyle(o: { affix: boolean; offset: number }): Record<string, string> {
  return o.affix ? { "--m-anchor-top": `${o.offset}px` } : {};
}

export function anchorLinkClasses(active: boolean): string[] {
  return ["m-anchor__link", ...(active ? ["m-anchor__link--active"] : [])];
}

/** 每条的层级写成变量，竖排时 CSS 按它缩进 */
export function anchorItemStyle(level: number): Record<string, string> {
  return { "--m-anchor-level": String(level) };
}

/** 铺平后的一条：模板直接循环 */
export interface AnchorEntry {
  readonly item: AnchorItem;
  /** 一级为 0 */
  readonly level: number;
  /** href 就是身份 */
  readonly key: string;
}

/** 把嵌套的 items 按文档顺序铺平，子锚点跟在父锚点后面、层级 +1 */
export function flattenAnchorItems(items: readonly AnchorItem[], level = 0): AnchorEntry[] {
  const list: AnchorEntry[] = [];
  for (const item of items) {
    list.push({ item, level, key: item.href });
    if (item.children?.length) list.push(...flattenAnchorItems(item.children, level + 1));
  }
  return list;
}

/** `#intro` → `intro`；带百分号编码的 id 解回来 */
export function anchorTargetId(href: string): string {
  const raw = href.startsWith("#") ? href.slice(1) : href;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** 一个锚点目标离容器顶边的距离；找不到目标的不在列表里 */
export interface AnchorPosition {
  readonly href: string;
  /** 目标顶边相对容器顶边的距离 px，负数表示已经滚过去了 */
  readonly top: number;
}

/**
 * 哪个锚点该激活：按文档顺序，最后一个顶边越过 offset 的。
 * 容器已经滚到底时激活最后一个 —— 末尾那节往往不够高，永远越不过 offset，不这样处理就永远点不亮。
 * 一个都没越过（还在第一个锚点上方）返回空串。
 */
export function activeAnchorHref(
  positions: readonly AnchorPosition[],
  o: { offset: number; atBottom: boolean },
): string {
  if (positions.length === 0) return "";
  if (o.atBottom) return positions[positions.length - 1]!.href;
  let active = "";
  for (const position of positions) {
    if (position.top <= o.offset + EDGE_TOLERANCE) active = position.href;
    else break;
  }
  return active;
}

/** 指示线的长度和位移：竖排走高度和 Y，横排走宽度和 X */
export function anchorIndicatorStyle(
  indicator: { size: number; offset: number },
  horizontal: boolean,
): Record<string, string> {
  return horizontal
    ? { width: `${indicator.size}px`, transform: `translateX(${indicator.offset}px)` }
    : { height: `${indicator.size}px`, transform: `translateY(${indicator.offset}px)` };
}

/**
 * 指示线的笔触参数：比分割线细、飞白重一点，像一笔顺着标题拖下来。
 * 不含 vertical —— 它在两个壳里都是响应式的，各自补上。
 */
export function anchorLineOptions(seed = SEED): Omit<BrushLineControllerOptions, "vertical"> {
  return { thickness: 2, seed, flyingWhite: 0.25, wobble: 0.6 };
}

/**
 * 把 container 解析成真正滚动的元素：选择器 → querySelector，函数 → 调它，元素 → 它自己，
 * 不传 → 整页。服务端、或者选择器找不到时返回 null，控制器这时什么都不监听。
 */
export function resolveAnchorContainer(container: AnchorContainer | undefined): HTMLElement | null {
  if (!isClient()) return null;
  if (typeof container === "function") return container();
  if (typeof container === "string") return document.querySelector<HTMLElement>(container);
  if (container) return container;
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** 整页滚动的那个元素：滚动事件不在它身上派发，要挂到 window 上，scrollTo 也走 window */
function isPageElement(el: HTMLElement): boolean {
  return (
    el === document.scrollingElement || el === document.documentElement || el === document.body
  );
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface AnchorOptions {
  container: AnchorContainer | undefined;
  /** 铺平后的全部 href，按文档顺序 */
  hrefs: readonly string[];
  offset: number;
  targetOffset: number;
  smooth: boolean;
  updateHash: boolean;
  horizontal: boolean;
  /** 当前激活的 href（v-model） */
  current: string;
  /** 激活项该换成 href 了；壳在这里写回 v-model 并发 change */
  onChange: (href: string) => void;
}

export interface AnchorSnapshot {
  /** 指示线的长度与位移 px；量不到（服务端、首帧、没有激活项）时都是 0 */
  readonly indicator: { readonly size: number; readonly offset: number };
}

export interface AnchorController extends Controller<AnchorSnapshot, AnchorOptions> {
  /** <nav> 的 ref 回调：指示线按它里面的激活项量 */
  setNav(el: HTMLElement | null): void;
  /** 这一轮 DOM 更新完之后调一次：重量指示线 */
  measure(): void;
  /** 点了某条：滚到目标，途中锁住判定；目标不存在时什么都不做 */
  scrollTo(href: string): void;
  /** 当前监听的滚动元素，给测试用 */
  element(): HTMLElement | null;
}

const SERVER_SNAPSHOT: AnchorSnapshot = { indicator: { size: 0, offset: 0 } };

export function createAnchor(initial: AnchorOptions): AnchorController {
  const store = createStore<AnchorSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let connected = false;
  let nav: HTMLElement | null = null;
  let stopNavSize: (() => void) | undefined;
  /** 当前监听着的滚动元素，以及它是按哪个 container 解析出来的 */
  let el: HTMLElement | null = null;
  let boundContainer: AnchorContainer | undefined = initial.container;
  let stopScroll: (() => void) | undefined;
  /** 点击后的滚动锁：滚动途中不判定激活项 */
  let locked = false;
  let unlockTimer: ReturnType<typeof setTimeout> | undefined;

  function unlock(): void {
    locked = false;
    unlockTimer = undefined;
  }

  /** 每来一次 scroll 就把解锁往后推；静默 SCROLL_SETTLE_MS 才算滚完 */
  function holdLock(): void {
    locked = true;
    if (unlockTimer !== undefined) clearTimeout(unlockTimer);
    unlockTimer = setTimeout(unlock, SCROLL_SETTLE_MS);
  }

  /** 每个目标离容器顶边的距离；整页时容器顶边就是视口顶边 */
  function positions(): AnchorPosition[] {
    if (!el) return [];
    const base = isPageElement(el) ? 0 : el.getBoundingClientRect().top;
    const list: AnchorPosition[] = [];
    for (const href of options.hrefs) {
      const target = document.getElementById(anchorTargetId(href));
      if (!target) continue;
      list.push({ href, top: target.getBoundingClientRect().top - base });
    }
    return list;
  }

  function atBottom(): boolean {
    if (!el) return false;
    const scrollable = el.scrollHeight > el.clientHeight + EDGE_TOLERANCE;
    return scrollable && el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE_TOLERANCE;
  }

  function judge(): void {
    if (!el) return;
    const href = activeAnchorHref(positions(), { offset: options.offset, atBottom: atBottom() });
    if (href !== options.current) options.onChange(href);
  }

  function onScroll(): void {
    if (locked) {
      holdLock();
      return;
    }
    judge();
  }

  function unbind(): void {
    stopScroll?.();
    stopScroll = undefined;
    el = null;
  }

  function bind(): void {
    unbind();
    if (!connected) return;
    boundContainer = options.container;
    el = resolveAnchorContainer(options.container);
    if (!el) return;
    const host: EventTarget = isPageElement(el) ? window : el;
    host.addEventListener("scroll", onScroll, { passive: true });
    stopScroll = () => host.removeEventListener("scroll", onScroll);
    judge();
  }

  function measure(): void {
    if (!connected) return;
    const active = nav?.querySelector<HTMLElement>(".m-anchor__link--active") ?? null;
    const indicator = active
      ? options.horizontal
        ? { size: active.offsetWidth, offset: active.offsetLeft }
        : { size: active.offsetHeight, offset: active.offsetTop }
      : { size: 0, offset: 0 };
    const prev = store.get().indicator;
    // 引用稳定：React 的 useSyncExternalStore 比的是引用，每次给新对象会抖成死循环
    if (prev.size === indicator.size && prev.offset === indicator.offset) return;
    store.set({ indicator });
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    /**
     * 渲染落地之后：container 换了、或上次解析时元素还没挂出来，重新解析并换监听；
     * 否则重判一次激活项（hrefs / offset 可能变了）并重量指示线（激活类名已经换好）
     */
    flush() {
      if (!connected) return;
      if (options.container !== boundContainer || !el) bind();
      else if (!locked) judge();
      measure();
    },

    connect() {
      if (connected) return;
      connected = true;
      bind();
      measure();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      unbind();
      if (unlockTimer !== undefined) clearTimeout(unlockTimer);
      unlock();
      store.set({ indicator: SERVER_SNAPSHOT.indicator });
    },

    setNav(next) {
      if (next === nav) return;
      stopNavSize?.();
      stopNavSize = undefined;
      nav = next;
      if (!next) return;
      // 字体加载完、容器变宽都会改链接的位置和长度
      stopNavSize = observeSize(next, () => measure(), "border-box");
    },
    measure,

    scrollTo(href) {
      if (!el) return;
      const target = document.getElementById(anchorTargetId(href));
      if (!target) return;
      holdLock();
      if (href !== options.current) options.onChange(href);
      const page = isPageElement(el);
      const base = page ? 0 : el.getBoundingClientRect().top;
      const top =
        (page ? window.scrollY : el.scrollTop) +
        target.getBoundingClientRect().top -
        base -
        options.targetOffset;
      const behavior: ScrollBehavior =
        options.smooth && !prefersReducedMotion() ? "smooth" : "instant";
      (page ? window : el).scrollTo({ top, behavior });
      if (options.updateHash) history.replaceState(null, "", href);
    },
    element: () => el,
  };
}
