/**
 * 浮层的焦点搬运：打开时把焦点送进浮层、关闭时还给参照元素。
 *
 * popover-trigger.ts 只管开合，不碰焦点；下拉菜单和气泡确认这类「打开后要用键盘操作」的浮层
 * 都要这两步，所以抽出来共用。它只有一点点状态（面板还没挂上时先记一笔），不驱动渲染，
 * 所以不做成 Controller，写成 attach / dispose 那一类的小对象就够了。
 */

export interface PopoverFocusOptions {
  /** 焦点该落到面板里的哪个元素；返回 null 就落在面板本身 */
  target: (panel: HTMLElement) => HTMLElement | null;
}

export interface PopoverFocusController {
  /** 参照元素（关闭时焦点还给它） */
  setReference(el: HTMLElement | null): void;
  /** 浮层面板；挂上时若有待处理的聚焦请求就立刻执行 */
  setPanel(el: HTMLElement | null): void;
  /** 把焦点送进面板；面板还没渲染出来就等它挂上再做 */
  requestFocus(): void;
  /** 焦点在面板里时还给参照元素；焦点已经在别处就不抢 */
  restoreFocus(): void;
  /** 焦点当前是否在面板里 */
  hasFocus(): boolean;
}

export function createPopoverFocus(options: PopoverFocusOptions): PopoverFocusController {
  let reference: HTMLElement | null = null;
  let panel: HTMLElement | null = null;
  let pending = false;

  function focusPanel(): void {
    if (!panel) {
      pending = true;
      return;
    }
    pending = false;
    (options.target(panel) ?? panel).focus({ preventScroll: true });
  }

  function hasFocus(): boolean {
    return (
      typeof document !== "undefined" &&
      panel !== null &&
      document.activeElement !== null &&
      panel.contains(document.activeElement)
    );
  }

  return {
    setReference(el) {
      reference = el;
    },
    setPanel(el) {
      panel = el;
      if (el && pending) focusPanel();
      if (!el) pending = false;
    },
    requestFocus: focusPanel,
    restoreFocus() {
      if (!hasFocus() || !reference?.isConnected) return;
      reference.focus({ preventScroll: true });
    },
    hasFocus,
  };
}
