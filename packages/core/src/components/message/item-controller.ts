/**
 * 一条消息自己的行为：进场动画、自动关闭的倒计时、鼠标悬停暂停、拖出去关掉、离场动画。
 *
 * 这些全是"碰 DOM + 定时器"的活，按约定一律在 core —— 两个壳里连 `setTimeout` 都不许出现。
 * 尺寸也在这里量：毛边墨纸的遮罩要按消息实际大小生成，量出来的宽高进快照，壳只管渲染。
 *
 * 三条铁律（见 runtime/controller.ts）：
 * - `update()` 纯赋值，不重启倒计时、不碰 DOM；
 * - `getServerSnapshot()` 恒定，宽高初值是 0（服务端量不到，进场动画也不在服务端跑）；
 * - `connect()/disconnect()` 幂等可反复配对。
 */
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import { isClient } from "../../runtime/dom";
import { revealElement, type WipeMaskOptions } from "../../ink/reveal";
import {
  animateMessage,
  enterKeyframes,
  leaveKeyframes,
  type MessageMotionBox,
  type MessageShift,
} from "./animate";
import type { MessageDirection } from "./types";

/** 擦入方向和滑入方向一致：从右滑入的就从右边擦出来 */
const REVEAL: Record<MessageDirection, NonNullable<WipeMaskOptions["direction"]>> = {
  "top-right": "left",
  "bottom-right": "left",
  "top-left": "right",
  "bottom-left": "right",
  "top-center": "down",
  "bottom-center": "up",
};

export interface MessageItemOptions {
  direction: MessageDirection;
  /** 毫秒；0 或负数表示不自动关闭 */
  duration: number;
  dragAllow: boolean;
  seed: number;
  /** 离场动画结束、可以从 DOM 移除时 */
  onClose: () => void;
}

export interface MessageItemSnapshot {
  readonly dragging: boolean;
  /** 已经拖过阈值，松手就关 */
  readonly removing: boolean;
  readonly closing: boolean;
  readonly x: number;
  readonly y: number;
  /** 量出来的尺寸，毛边墨纸的遮罩按它生成；服务端是 0，壳这时不生成遮罩 */
  readonly width: number;
  readonly height: number;
}

export interface MessageItemController extends Controller<MessageItemSnapshot, MessageItemOptions> {
  /** 根元素的 ref 回调：挂上、卸下都走它 */
  setRoot(el: HTMLElement | null): void;
  /**
   * 由渲染出口驱动的"请你离场"（队列的 closeAll / handle.close() 推下来的）。
   * 和 MDialog 那边 `modal.setOpen()` 一个路数：状态在外面，控制器只接一个开关。
   */
  setClosing(closing: boolean): void;
  /** 自己要求关闭（点关闭按钮） */
  close(): void;
  onPointerDown(event: PointerEvent): void;
  onPointerMove(event: PointerEvent): void;
  onPointerUp(event: PointerEvent): void;
  onMouseEnter(): void;
  onMouseLeave(): void;
}

const SERVER_SNAPSHOT: MessageItemSnapshot = {
  dragging: false,
  removing: false,
  closing: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

/** 当前这条消息在列表里占的位置：宽高 + 与相邻消息的间距（离场时要一起收掉） */
function motionBox(el: HTMLElement): MessageMotionBox {
  const parent = el.parentElement;
  const gap = parent ? Number.parseFloat(getComputedStyle(parent).rowGap) : 0;
  return { width: el.offsetWidth, height: el.offsetHeight, gap: Number.isNaN(gap) ? 0 : gap };
}

export function createMessageItem(initial: MessageItemOptions): MessageItemController {
  const store = createStore<MessageItemSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let root: HTMLElement | null = null;
  let connected = false;
  /** 根元素还没挂上就 connect 了，等 setRoot 到位再补做进场 */
  let entered = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dragStart = 0;
  let pointerId: number | undefined;

  /** 只能往"出去"的那一边拖：右侧往右、左侧往左、顶部居中往上、底部居中往下 */
  const axis = (): "x" | "y" => (options.direction.endsWith("center") ? "y" : "x");
  const sign = () =>
    options.direction.endsWith("right") || options.direction === "bottom-center" ? 1 : -1;

  function stopTimer(): void {
    clearTimeout(timer);
    timer = undefined;
  }

  function startTimer(): void {
    stopTimer();
    if (!connected || options.duration <= 0 || store.get().closing) return;
    timer = setTimeout(close, options.duration);
  }

  async function close(): Promise<void> {
    const el = root;
    if (store.get().closing || !el) return;
    store.set({ closing: true });
    stopTimer();
    const shift: MessageShift = { x: store.get().x, y: store.get().y };
    await animateMessage(el, leaveKeyframes(options.direction, motionBox(el), shift), "forwards");
    options.onClose();
  }

  function enter(): void {
    const el = root;
    if (entered || !el || !connected || !isClient()) return;
    entered = true;
    // 量一次就够：消息内容不会自己变大，这个尺寸只用来按实际大小生成毛边墨纸的遮罩
    store.set({ width: el.offsetWidth, height: el.offsetHeight });
    void animateMessage(el, enterKeyframes(options.direction, motionBox(el)), "none");
    // 墨迹引擎开着才擦入；没开的话元素直接显示，不留一层没用的 mask
    if (document.documentElement.classList.contains("m-ink-ready")) {
      void revealElement(el, {
        seed: options.seed,
        direction: REVEAL[options.direction],
        duration: 600,
      });
    }
    startTimer();
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
      enter();
    },
    disconnect() {
      connected = false;
      stopTimer();
    },

    setRoot(el) {
      root = el;
      if (el) enter();
    },

    setClosing(closing) {
      if (closing) void close();
    },
    close() {
      void close();
    },

    onPointerDown(event) {
      if (!options.dragAllow || store.get().closing || event.button !== 0) return;
      // 点关闭按钮不算拖
      if (event.target instanceof Element && event.target.closest(".m-message__close")) return;
      pointerId = event.pointerId;
      dragStart = axis() === "x" ? event.clientX : event.clientY;
      store.set({ dragging: true });
      stopTimer();
      try {
        root?.setPointerCapture(event.pointerId);
      } catch {
        // 合成事件没有活动指针，拿不到捕获也不影响拖
      }
    },

    onPointerMove(event) {
      if (!store.get().dragging || event.pointerId !== pointerId) return;
      const raw = (axis() === "x" ? event.clientX : event.clientY) - dragStart;
      const delta = raw * sign() > 0 ? raw : 0;
      // 直接量 DOM：观察器报上来的尺寸有延迟，刚挂载就拖会拿到 0
      const el = root;
      const size = el ? (axis() === "x" ? el.offsetWidth : el.offsetHeight) : 0;
      store.set({
        x: axis() === "x" ? delta : 0,
        y: axis() === "x" ? 0 : delta,
        removing: size > 0 && Math.abs(delta) > size / 3,
      });
    },

    onPointerUp(event) {
      if (!store.get().dragging || event.pointerId !== pointerId) return;
      store.set({ dragging: false });
      pointerId = undefined;
      if (store.get().removing) {
        void close();
        return;
      }
      store.set({ x: 0, y: 0 });
      startTimer();
    },

    onMouseEnter: stopTimer,
    onMouseLeave() {
      if (!store.get().dragging) startTimer();
    },
  };
}
