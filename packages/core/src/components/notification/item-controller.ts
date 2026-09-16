/**
 * 一条通知自己的行为：进场动画、自动关闭的倒计时、鼠标悬停暂停、离场动画。
 *
 * 和消息条（message/item-controller.ts）是同一个路数，少了拖动关闭：通知带标题和正文，
 * 用户会在上面选字、点链接，拖着走会误触。进出场的关键帧直接复用消息那一份 ——
 * 四个角都在消息的六个方向之内，右侧的从右滑入、左侧的从左滑入，离场原路退回并收掉高度。
 *
 * 三条铁律（见 runtime/controller.ts）：
 * - `update()` 纯赋值，不重启倒计时、不碰 DOM；
 * - `getServerSnapshot()` 恒定，宽高初值是 0（服务端量不到）；
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
} from "../message/animate";
import type { NotificationPlacement } from "./types";

/** 擦入方向和滑入方向一致：从右滑入的就从右边擦出来 */
const REVEAL: Record<NotificationPlacement, NonNullable<WipeMaskOptions["direction"]>> = {
  "top-right": "left",
  "bottom-right": "left",
  "top-left": "right",
  "bottom-left": "right",
};

export interface NotificationItemOptions {
  placement: NotificationPlacement;
  /** 毫秒；0 或负数表示不自动关闭 */
  duration: number;
  seed: number;
  /** 离场动画结束、可以从 DOM 移除时 */
  onClose: () => void;
}

export interface NotificationItemSnapshot {
  readonly closing: boolean;
  /** 量出来的尺寸，毛边纸的遮罩按它生成；服务端是 0，壳这时不生成遮罩 */
  readonly width: number;
  readonly height: number;
}

export interface NotificationItemController extends Controller<
  NotificationItemSnapshot,
  NotificationItemOptions
> {
  /** 根元素的 ref 回调：挂上、卸下都走它 */
  setRoot(el: HTMLElement | null): void;
  /** 由渲染出口驱动的"请你离场"（队列的 closeAll / handle.close() 推下来的） */
  setClosing(closing: boolean): void;
  /** 自己要求关闭（点关闭按钮） */
  close(): void;
  onMouseEnter(): void;
  onMouseLeave(): void;
}

const SERVER_SNAPSHOT: NotificationItemSnapshot = { closing: false, width: 0, height: 0 };

/** 当前这条通知在栈里占的位置：宽高 + 与相邻通知的间距（离场时要一起收掉） */
function motionBox(el: HTMLElement): MessageMotionBox {
  const parent = el.parentElement;
  const gap = parent ? Number.parseFloat(getComputedStyle(parent).rowGap) : 0;
  return { width: el.offsetWidth, height: el.offsetHeight, gap: Number.isNaN(gap) ? 0 : gap };
}

export function createNotificationItem(
  initial: NotificationItemOptions,
): NotificationItemController {
  const store = createStore<NotificationItemSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let root: HTMLElement | null = null;
  let connected = false;
  /** 根元素还没挂上就 connect 了，等 setRoot 到位再补做进场 */
  let entered = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

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
    await animateMessage(
      el,
      leaveKeyframes(options.placement, motionBox(el), { x: 0, y: 0 }),
      "forwards",
    );
    options.onClose();
  }

  function enter(): void {
    const el = root;
    if (entered || !el || !connected || !isClient()) return;
    entered = true;
    // 量一次就够：这个尺寸只用来按实际大小生成毛边纸的遮罩
    store.set({ width: el.offsetWidth, height: el.offsetHeight });
    void animateMessage(el, enterKeyframes(options.placement, motionBox(el)), "none");
    // 墨迹引擎开着才擦入；没开的话元素直接显示，不留一层没用的 mask
    if (document.documentElement.classList.contains("m-ink-ready")) {
      void revealElement(el, {
        seed: options.seed,
        direction: REVEAL[options.placement],
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

    onMouseEnter: stopTimer,
    onMouseLeave: startTimer,
  };
}
