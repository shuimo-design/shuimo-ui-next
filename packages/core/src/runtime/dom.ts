/** 一点 DOM 小工具。全部对服务端安全：没有 document 时要么返回兜底值，要么什么都不做。 */

export function isClient(): boolean {
  return typeof document !== "undefined";
}

/** 读一次布局，强制浏览器把前面刚写的样式落实（过渡动画起手要用） */
export function reflow(el: HTMLElement): void {
  void el.offsetHeight;
}

export const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** 元素内部当前可聚焦、且真的显示着的元素，按文档顺序 */
export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
  );
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
