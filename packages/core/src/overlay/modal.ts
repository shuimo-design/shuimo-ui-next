/**
 * 模态层共用的行为：弹窗 / 抽屉 / 确认框都是"遮罩 + 面板"，
 * 打开时锁页面滚动、把焦点收进面板、ESC 只关最上面那一层，关闭时把焦点还给打开前的元素。
 *
 * 这一整套原来在 Vue 包里，136 行只有 4 处 Vue API（watch / nextTick / onBeforeUnmount / Ref），
 * 其余全是纯 DOM 命令式代码。搬过来之后两个框架各写五行胶水就能用。
 * 服务端没有 document，connect() 之前什么都不做。
 */
import { createStore } from "../runtime/store";
import type { Controller } from "../runtime/controller";
import { focusables, isClient } from "../runtime/dom";

export interface ModalMask {
  /** 是否显示半透明遮罩底色，默认 true */
  show?: boolean;
  /** 点击面板外是否关闭，默认 true */
  clickClose?: boolean;
}

/** `mask` prop 既接受布尔（只控制显示）也接受对象 —— 纯函数，两个壳共用 */
export function resolveMask(mask: boolean | ModalMask | undefined): Required<ModalMask> {
  if (typeof mask === "boolean") return { show: mask, clickClose: true };
  return { show: mask?.show ?? true, clickClose: mask?.clickClose ?? true };
}

/* ── 模块级全局：同时开着几层就锁几次，最后一层关掉才放开滚动 ───────────── */
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockScroll(): void {
  if (lockCount++ > 0) return;
  const html = document.documentElement;
  savedOverflow = html.style.overflow;
  savedPaddingRight = html.style.paddingRight;
  // 滚动条消失会让页面横向跳一下，用同宽的内边距补上
  const gutter = window.innerWidth - html.clientWidth;
  if (gutter > 0) html.style.paddingRight = `${gutter}px`;
  html.style.overflow = "hidden";
}

function unlockScroll(): void {
  if (lockCount === 0 || --lockCount > 0) return;
  const html = document.documentElement;
  html.style.overflow = savedOverflow;
  html.style.paddingRight = savedPaddingRight;
}

/** 打开着的模态层，栈顶那层才响应 ESC。两个框架混用同一页时也共用这一份 */
const stack: symbol[] = [];

export interface ModalOptions {
  /** 是否响应 ESC */
  closeOnEsc: boolean;
  /** 请求关闭；控制器只发起，不自己改开关状态 */
  onRequestClose: () => void;
}

export interface ModalSnapshot {
  /** 是否已激活（锁了滚动、进了栈）。留给测试断言用 */
  readonly active: boolean;
}

export interface ModalController extends Controller<ModalSnapshot, ModalOptions> {
  /** 面板元素的 ref 回调：挂上、卸下都走它 */
  setPanel(el: HTMLElement | null): void;
  /** 开关变化时由壳在 effect 里调 */
  setOpen(open: boolean): void;
  /** 挂在面板的 keydown 上：Tab 在面板内循环，不跑到遮罩后面的页面里去 */
  trapFocus(event: KeyboardEvent): void;
}

const SERVER_SNAPSHOT: ModalSnapshot = { active: false };

export function createModal(initial: ModalOptions): ModalController {
  const store = createStore<ModalSnapshot>(SERVER_SNAPSHOT);
  const token = Symbol("modal");
  let options = initial;
  let panel: HTMLElement | null = null;
  let opener: HTMLElement | null = null;
  let connected = false;
  let wantOpen = false;
  let active = false;
  /** 面板还没挂上就要求聚焦时记一笔，setPanel 到位后补做 */
  let focusPending = false;

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    if (stack[stack.length - 1] !== token || !options.closeOnEsc) return;
    event.preventDefault();
    options.onRequestClose();
  }

  function focusPanel(): void {
    if (!panel || !active) {
      focusPending = true;
      return;
    }
    focusPending = false;
    if (panel.contains(document.activeElement)) return;
    // 有 autofocus 的先给它，否则落在面板本身
    (panel.querySelector<HTMLElement>("[autofocus]") ?? panel).focus({ preventScroll: true });
  }

  function activate(): void {
    if (active || !isClient()) return;
    active = true;
    lockScroll();
    stack.push(token);
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.addEventListener("keydown", onKeydown);
    // 原来靠 nextTick 等这一轮渲染完；现在靠 setPanel 的时机，更准，也不依赖任何框架的调度
    focusPanel();
    store.set({ active: true });
  }

  function deactivate(): void {
    if (!active) return;
    active = false;
    focusPending = false;
    unlockScroll();
    const index = stack.indexOf(token);
    if (index >= 0) stack.splice(index, 1);
    document.removeEventListener("keydown", onKeydown);
    // 打开它的那个按钮还在页面上才还回去；用户中途点到别处就不抢
    const current = document.activeElement;
    if (
      opener?.isConnected &&
      (current === null || current === document.body || (panel && panel.contains(current)))
    ) {
      opener.focus({ preventScroll: true });
    }
    opener = null;
    store.set({ active: false });
  }

  function sync(): void {
    if (!connected) return;
    if (wantOpen) activate();
    else deactivate();
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
      sync();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      deactivate();
    },

    setPanel(el) {
      panel = el;
      if (el && focusPending) focusPanel();
    },
    setOpen(open) {
      if (wantOpen === open) return;
      wantOpen = open;
      sync();
    },

    trapFocus(event) {
      if (event.key !== "Tab" || !panel) return;
      const list = focusables(panel);
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    },
  };
}
