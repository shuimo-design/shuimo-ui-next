/**
 * 浮层的开合时序：找参照元素、按触发方式开合、延时、Escape 与外部点击。
 * 定位不在这里（那是 floating.ts 的事），这里只管「什么时候开、什么时候关」。
 *
 * 原来是 Vue 的组合式函数，149 行里真正依赖 Vue 的只有「响应式读 props」和「挂卸时机」。
 * 显隐状态本身不归它管（那是使用方的 v-model / 受控 prop），它只负责**请求**改变。
 */
import { createStore } from "../runtime/store";
import type { Controller } from "../runtime/controller";

export type PopoverTrigger = "hover" | "click" | "focus" | "manual";

export interface PopoverTriggerOptions {
  trigger: PopoverTrigger;
  disabled: boolean;
  openDelay: number;
  closeDelay: number;
  disableClickAway: boolean;
  /** 当前显隐，由使用方持有 */
  show: boolean;
  /** 请求改变显隐 */
  onChange: (open: boolean) => void;
}

export interface PopoverTriggerSnapshot {
  /** 真正用来定位的元素：壳的第一个元素子节点，没有就是壳自己 */
  readonly reference: HTMLElement | null;
  /** 壳里没有元素（纯文本）时壳自己当参照，此时壳要有盒子 */
  readonly wrapOnly: boolean;
}

export interface PopoverTriggerController extends Controller<
  PopoverTriggerSnapshot,
  PopoverTriggerOptions
> {
  /** 包住触发内容的壳 */
  setWrapper(el: HTMLElement | null): void;
  /** 浮层容器，用来判断焦点 / 指针是不是还在浮层里 */
  setPanel(el: HTMLElement | null): void;
  /** 壳里的内容变了要重新挑参照元素（Vue 的 onUpdated / React 的每次渲染后） */
  refresh(): void;
  setOpen(next: boolean): void;
  onTriggerEnter(): void;
  onTriggerLeave(): void;
  onTriggerClick(): void;
  onTriggerFocusin(event: FocusEvent): void;
  onTriggerFocusout(event: FocusEvent): void;
  onPanelEnter(): void;
  onPanelLeave(): void;
  onPanelFocusout(event: FocusEvent): void;
  onClickOutside(): void;
}

const SERVER_SNAPSHOT: PopoverTriggerSnapshot = { reference: null, wrapOnly: false };

export function createPopoverTrigger(initial: PopoverTriggerOptions): PopoverTriggerController {
  const store = createStore<PopoverTriggerSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let wrapper: HTMLElement | null = null;
  let panel: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let connected = false;

  const is = (kind: PopoverTrigger) => options.trigger === kind;
  const isOpen = () => options.show && !options.disabled;

  function pickReference(): void {
    if (!wrapper) {
      store.set({ reference: null, wrapOnly: false });
      return;
    }
    const first = wrapper.firstElementChild;
    const reference = first instanceof HTMLElement ? first : wrapper;
    store.set({ reference, wrapOnly: reference === wrapper });
  }

  function setOpen(next: boolean): void {
    clearTimeout(timer);
    if (next && options.disabled) return;
    if (options.show === next) return;
    options.onChange(next);
  }

  function schedule(next: boolean): void {
    clearTimeout(timer);
    const delay = next ? options.openDelay : options.closeDelay;
    if (delay <= 0) {
      setOpen(next);
      return;
    }
    timer = setTimeout(() => setOpen(next), delay);
  }

  function inside(target: EventTarget | null): boolean {
    return (
      target instanceof Node &&
      (panel?.contains(target) === true || store.get().reference?.contains(target) === true)
    );
  }

  // Escape 关闭：焦点可能在页面任何地方，所以听 document
  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !isOpen() || is("manual")) return;
    setOpen(false);
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      const wasDisabled = options.disabled;
      options = next;
      // 变成禁用就立刻收起：这是状态转移，不是纯赋值，所以放在这里是有意的例外，
      // 但它只在 disabled 真的翻转时发生，React 渲染期多调几次也不会有副作用
      if (!wasDisabled && next.disabled) {
        clearTimeout(timer);
        if (next.show) next.onChange(false);
      }
    },

    connect() {
      if (connected || typeof document === "undefined") return;
      connected = true;
      document.addEventListener("keydown", onKeydown);
      pickReference();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeydown);
    },

    setWrapper(el) {
      if (el === wrapper) return;
      wrapper = el;
      pickReference();
    },
    setPanel(el) {
      panel = el;
    },
    refresh: pickReference,
    setOpen,

    onTriggerEnter() {
      if (is("hover")) schedule(true);
    },
    onTriggerLeave() {
      if (is("hover")) schedule(false);
    },
    onTriggerClick() {
      if (is("click")) setOpen(!options.show);
    },
    onTriggerFocusin(event) {
      if (is("focus")) schedule(true);
      // hover 触发也响应键盘聚焦，不然键盘用户永远看不到提示；鼠标点出来的焦点不算
      else if (
        is("hover") &&
        event.target instanceof Element &&
        event.target.matches(":focus-visible")
      ) {
        schedule(true);
      }
    },
    onTriggerFocusout(event) {
      if ((is("focus") || is("hover")) && !inside(event.relatedTarget)) schedule(false);
    },
    onPanelEnter() {
      if (is("hover")) clearTimeout(timer);
    },
    onPanelLeave() {
      if (is("hover")) schedule(false);
    },
    onPanelFocusout(event) {
      if (is("focus") && !inside(event.relatedTarget)) schedule(false);
    },
    onClickOutside() {
      if (is("click") && !options.disableClickAway) setOpen(false);
    },
  };
}
