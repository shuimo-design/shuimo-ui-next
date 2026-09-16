/**
 * 回到顶部的无框架部分：目标解析、滚动监听、可见性判断、滚回顶部，全在这里的控制器里；
 * 壳只挂 ref、渲染一个传送到 body 的按钮。
 *
 * 默认外观是一枚印文「顶」的小方印，直接用 MStamp 渲染（参数由 backTopStamp 给出，种子固定），
 * 不另写一个素材生成器：印章的几何、磨损、字体度量 MStamp 都有，而且它本来就是服务端确定的。
 */
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import { isClient, prefersReducedMotion } from "../../runtime/dom";
import { scrollCssSize } from "../scroll";
import type { StampProps } from "../stamp";
import type { BackTopProps } from "./types";

export type { BackTopEmits, BackTopProps, BackTopSlots } from "./types";

/** 按钮的无障碍名，两个壳必须一致 */
export const BACK_TOP_LABEL = "回到顶部";
/** 默认那枚印的印文 */
export const BACK_TOP_TEXT = "顶";
/** 进出场过渡的类名前缀：m-back-top-enter-from / -active / -to */
export const BACK_TOP_TRANSITION = "m-back-top";
/** 滚过这么多 px 才出现 */
export const BACK_TOP_VISIBILITY_HEIGHT = 200;
/** 默认离视口右边、底部的距离 px */
export const BACK_TOP_OFFSET = 40;
/** 默认那枚印的边长 px */
const STAMP_SIZE = 40;

/* ── 纯函数：class / 行内样式 / 印章参数 / 目标解析 ─────────────── */

export function backTopClasses(o: { custom: boolean }): string[] {
  return ["m-back-top", ...(o.custom ? ["m-back-top--custom"] : [])];
}

/** 位置写成组件私有变量，CSS 里 right / bottom 引用它 */
export function backTopStyle(o: {
  right?: number | string;
  bottom?: number | string;
}): Record<string, string> {
  return {
    "--m-back-top-right": scrollCssSize(o.right ?? BACK_TOP_OFFSET)!,
    "--m-back-top-bottom": scrollCssSize(o.bottom ?? BACK_TOP_OFFSET)!,
  };
}

/** 默认那枚印：阴文小方章，印文「顶」；种子固定，服务端和客户端算出同一枚 */
export function backTopStamp(seed = 1): StampProps {
  return {
    text: BACK_TOP_TEXT,
    shape: "square",
    mode: "yin",
    size: STAMP_SIZE,
    seed,
    corner: "round",
  };
}

/**
 * 把 target 解析成真正滚动的元素：选择器 → querySelector，函数 → 调它，不传 → 整页。
 * 服务端、或者选择器找不到时返回 null，控制器这时什么都不监听。
 */
export function resolveBackTopTarget(target: BackTopProps["target"]): HTMLElement | null {
  if (!isClient()) return null;
  if (typeof target === "function") return target();
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** 整页滚动的那个元素：滚动事件不在它身上派发，要挂到 window 上 */
function isPageElement(el: HTMLElement): boolean {
  return (
    el === document.scrollingElement || el === document.documentElement || el === document.body
  );
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface BackTopOptions {
  target: BackTopProps["target"];
  visibilityHeight: number;
}

export interface BackTopSnapshot {
  /** 滚过了阈值，按钮该显示 */
  readonly visible: boolean;
}

export interface BackTopController extends Controller<BackTopSnapshot, BackTopOptions> {
  /** 把目标滚回顶部；减弱动效时瞬时到位，否则平滑滚动 */
  scrollToTop(): void;
  /** 当前监听的滚动元素，给测试和 expose 用 */
  element(): HTMLElement | null;
}

/** 服务端算得出来的那份：没有滚动位置，按钮不显示。引用恒定 */
const SERVER_SNAPSHOT: BackTopSnapshot = { visible: false };

export function createBackTop(initial: BackTopOptions): BackTopController {
  const store = createStore<BackTopSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let connected = false;
  /** 当前监听着的元素，以及它是按哪个 target 解析出来的 */
  let el: HTMLElement | null = null;
  let boundTarget: BackTopProps["target"] = initial.target;
  let stop: (() => void) | undefined;

  function measure(): void {
    if (!el) return;
    store.set({ visible: el.scrollTop > options.visibilityHeight });
  }

  function unbind(): void {
    stop?.();
    stop = undefined;
    el = null;
  }

  function bind(): void {
    unbind();
    if (!connected) return;
    boundTarget = options.target;
    el = resolveBackTopTarget(options.target);
    if (!el) return;
    const host: EventTarget = isPageElement(el) ? window : el;
    host.addEventListener("scroll", measure, { passive: true });
    stop = () => host.removeEventListener("scroll", measure);
    measure();
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
     * 稍后才渲染的容器），重新解析并换监听；阈值变了就重新判一次可见性。
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
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      unbind();
      store.set({ visible: false });
    },

    scrollToTop() {
      el?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "instant" : "smooth" });
    },
    element: () => el,
  };
}
