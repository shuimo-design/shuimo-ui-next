/**
 * 模态层共用的行为：Dialog / Drawer 都是"遮罩 + 面板"，打开时锁页面滚动、把焦点收进面板、
 * ESC 只关最上面那一层，关闭时把焦点还给打开前的元素。只在客户端生效，SSR 下全是空操作。
 */
import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";

export interface ModalMask {
  /** 是否显示半透明遮罩底色，默认 true */
  show?: boolean;
  /** 点击面板外是否关闭，默认 true */
  clickClose?: boolean;
}

/** `mask` prop 既接受布尔（只控制显示）也接受对象 */
export function resolveMask(mask: boolean | ModalMask | undefined): Required<ModalMask> {
  if (typeof mask === "boolean") return { show: mask, clickClose: true };
  return { show: mask?.show ?? true, clickClose: mask?.clickClose ?? true };
}

/** 同时开着几层就锁几次，最后一层关掉才放开滚动 */
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockScroll() {
  if (lockCount++ > 0) return;
  const html = document.documentElement;
  savedOverflow = html.style.overflow;
  savedPaddingRight = html.style.paddingRight;
  // 滚动条消失会让页面横向跳一下，用同宽的内边距补上
  const gutter = window.innerWidth - html.clientWidth;
  if (gutter > 0) html.style.paddingRight = `${gutter}px`;
  html.style.overflow = "hidden";
}

function unlockScroll() {
  if (lockCount === 0 || --lockCount > 0) return;
  const html = document.documentElement;
  html.style.overflow = savedOverflow;
  html.style.paddingRight = savedPaddingRight;
}

/** 打开着的模态层，栈顶那层才响应 ESC */
const stack: symbol[] = [];

const FOCUSABLE =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export interface UseModalOptions {
  /** 是否打开 */
  open: () => boolean;
  /** 面板元素（焦点落点、焦点圈定的范围） */
  panel: Ref<HTMLElement | null>;
  /** 是否响应 ESC */
  closeOnEsc: () => boolean;
  /** 请求关闭 */
  close: () => void;
}

export function useModal(options: UseModalOptions) {
  const token = Symbol("modal");
  let opener: HTMLElement | null = null;
  let active = false;

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || stack[stack.length - 1] !== token || !options.closeOnEsc())
      return;
    event.preventDefault();
    options.close();
  }

  function activate() {
    if (active || typeof document === "undefined") return;
    active = true;
    lockScroll();
    stack.push(token);
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.addEventListener("keydown", onKeydown);
    // 面板是 v-show 出来的，等这一轮渲染完再聚焦；有 autofocus 的先给它，否则落在面板本身
    void nextTick(() => {
      const panel = options.panel.value;
      if (!panel || !active || panel.contains(document.activeElement)) return;
      const target = panel.querySelector<HTMLElement>("[autofocus]") ?? panel;
      target.focus({ preventScroll: true });
    });
  }

  function deactivate() {
    if (!active) return;
    active = false;
    unlockScroll();
    const index = stack.indexOf(token);
    if (index >= 0) stack.splice(index, 1);
    document.removeEventListener("keydown", onKeydown);
    // 打开它的那个按钮还在页面上才还回去；用户中途点到别处就不抢
    const current = document.activeElement;
    const panel = options.panel.value;
    if (
      opener?.isConnected &&
      (current === null || current === document.body || (panel && panel.contains(current)))
    ) {
      opener.focus({ preventScroll: true });
    }
    opener = null;
  }

  watch(options.open, (open) => (open ? activate() : deactivate()), { immediate: true });
  onBeforeUnmount(deactivate);

  /** 挂在面板 keydown 上：Tab 在面板内循环，不跑到遮罩后面的页面里去 */
  function trapFocus(event: KeyboardEvent) {
    if (event.key !== "Tab") return;
    const panel = options.panel.value;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
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
  }

  return { trapFocus };
}
