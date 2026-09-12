/**
 * 浮层定位控制器。
 *
 * 原来用的是 @floating-ui/vue，那是 Vue 专属的封装；它底下的 @floating-ui/dom
 * 本来就框架无关，所以直接用底层的，两个框架共用同一份 middleware 配置和时序。
 */
import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  offset as offsetMiddleware,
  shift,
  size,
  type Placement,
} from "@floating-ui/dom";
import { createStore } from "../runtime/store";
import type { Controller } from "../runtime/controller";

export type { Placement };

export interface FloatingOptions {
  placement: Placement;
  /** 与参照元素的间距 px */
  offset: number;
  /** 浮层宽度跟随参照元素 */
  matchWidth: boolean;
  /** 开着才定位、才订阅滚动和尺寸变化 */
  open: boolean;
}

export interface FloatingSnapshot {
  readonly x: number;
  readonly y: number;
  readonly placement: Placement;
  /** 第一次算出坐标之前浮层要藏住，否则会从左上角飞过来 */
  readonly positioned: boolean;
  readonly arrowX: number | null;
  readonly arrowY: number | null;
}

export interface FloatingController extends Controller<FloatingSnapshot, FloatingOptions> {
  setReference(el: HTMLElement | null): void;
  setFloating(el: HTMLElement | null): void;
  setArrow(el: HTMLElement | null): void;
}

const SERVER_SNAPSHOT: FloatingSnapshot = {
  x: 0,
  y: 0,
  placement: "bottom-start",
  positioned: false,
  arrowX: null,
  arrowY: null,
};

export function createFloating(initial: FloatingOptions): FloatingController {
  const store = createStore<FloatingSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let reference: HTMLElement | null = null;
  let floating: HTMLElement | null = null;
  let arrow: HTMLElement | null = null;
  let connected = false;
  /** options 变过、但还没重算坐标；由 flush() 消费 */
  let dirty = false;
  let stopAutoUpdate: (() => void) | undefined;

  function middleware() {
    return [
      offsetMiddleware(options.offset),
      flip(),
      shift({ padding: 8 }),
      // 箭头要避开圆角，离浮层边缘至少留 6px
      ...(arrow ? [arrowMiddleware({ element: arrow, padding: 6 })] : []),
      ...(options.matchWidth
        ? [
            size({
              apply({ rects, elements }) {
                elements.floating.style.width = `${rects.reference.width}px`;
              },
            }),
          ]
        : []),
    ];
  }

  async function compute(): Promise<void> {
    if (!reference || !floating) return;
    const result = await computePosition(reference, floating, {
      placement: options.placement,
      // 用 top/left 摆位置而不是 transform：入场动画要用 transform 做缩放，
      // 两者同属性会让"从 (0,0) 到目标位置"的定位变化被当成动画，浮层从左上角飞过来
      strategy: "fixed",
      middleware: middleware(),
    });
    store.set({
      x: result.x,
      y: result.y,
      placement: result.placement,
      positioned: true,
      arrowX: result.middlewareData.arrow?.x ?? null,
      arrowY: result.middlewareData.arrow?.y ?? null,
    });
  }

  function sync(): void {
    stopAutoUpdate?.();
    stopAutoUpdate = undefined;
    if (!connected || !options.open || !reference || !floating) {
      if (store.get().positioned) store.set({ positioned: false });
      return;
    }
    stopAutoUpdate = autoUpdate(reference, floating, () => void compute());
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      const changed =
        next.open !== options.open ||
        next.placement !== options.placement ||
        next.offset !== options.offset ||
        next.matchWidth !== options.matchWidth;
      options = next;
      // update 的契约是纯赋值：这里只记账，真正的重算在 flush() 里做。
      // 以前是直接 sync()，而 sync() 会 store.set 通知订阅者 —— React 的胶水在渲染期
      // 调 update，于是变成"渲染另一个组件时更新了 MPopper"，控制台稳定报警告
      if (changed) dirty = true;
    },

    // 壳在渲染落地之后调；没变过就什么都不做
    flush() {
      if (!dirty || !connected) return;
      dirty = false;
      sync();
    },

    connect() {
      if (connected) return;
      connected = true;
      dirty = false;
      sync();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      stopAutoUpdate?.();
      stopAutoUpdate = undefined;
    },

    setReference(el) {
      if (el === reference) return;
      reference = el;
      sync();
    },
    setFloating(el) {
      if (el === floating) return;
      floating = el;
      sync();
    },
    setArrow(el) {
      if (el === arrow) return;
      arrow = el;
      sync();
    },
  };
}

/** 浮层根元素上的内联样式：定位 + 箭头坐标 + 没算出来之前先藏住 */
export function floatingStyle(state: FloatingSnapshot): Record<string, string> {
  return {
    position: "fixed",
    // 用 top/left 摆位置，**不能用 transform**：入场动画本身要用 transform 做缩放，
    // 两者同属性会让"从 (0,0) 到目标位置"的定位变化也被当成动画，浮层从左上角飞过来
    left: `${state.x}px`,
    top: `${state.y}px`,
    ...(state.arrowX === null ? {} : { "--m-popper-arrow-x": `${state.arrowX}px` }),
    ...(state.arrowY === null ? {} : { "--m-popper-arrow-y": `${state.arrowY}px` }),
    // 还没算出坐标时浮层停在 (0,0)，正好压在触发元素上。
    // 用 opacity 而不是 visibility 藏它（后者会让面板里的格子接不住焦点），
    // 但 opacity: 0 照样拦指针事件 —— 必须一起关掉，否则触发元素第二次点不动
    // pointerEvents 必须写成驼峰：React 的 style 对象不认短横线写法，会整条丢掉并在
    // 控制台报 "Unsupported style property"。Vue 两种写法都收，所以统一用驼峰
    ...(state.positioned ? {} : { opacity: "0", pointerEvents: "none" }),
  };
}
