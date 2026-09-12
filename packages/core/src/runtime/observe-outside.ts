/**
 * 点在这些元素之外时通知一声。替代 @vueuse/core 的 onClickOutside。
 *
 * 用 pointerdown 而不是 click：下拉面板里的项目往往在 mousedown 阶段就把自己摘掉了，
 * 等到 click 时 event.target 已经不在文档里，`contains` 判断会误判成"点在外面"。
 */
export interface OutsideOptions {
  /** 这些元素（及其内部）里的点击不算"外面" */
  ignore?: () => (HTMLElement | null | undefined)[];
}

export function observeOutside(
  target: () => HTMLElement | null,
  handler: (event: PointerEvent) => void,
  options: OutsideOptions = {},
): () => void {
  if (typeof document === "undefined") return () => {};
  const onPointerDown = (event: PointerEvent) => {
    const node = event.target as Node | null;
    if (!node) return;
    const inside = target()?.contains(node);
    if (inside) return;
    for (const el of options.ignore?.() ?? []) {
      if (el?.contains(node)) return;
    }
    handler(event);
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  return () => document.removeEventListener("pointerdown", onPointerDown, true);
}
