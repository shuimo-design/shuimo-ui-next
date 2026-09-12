import { reflow } from "../runtime/dom";
import type { TransitionHooks } from "./runner";

/**
 * 收起过渡：CSS 只能从一个具体高度过渡到 0，`height: auto` 是过渡不动的。
 * 所以离场前先把当前实际高度钉成内联值，逼一次重排，再一起归零。
 * 纯 DOM 操作，两个框架共用同一个对象。
 */
export const collapseHeightHooks: TransitionHooks = {
  onBeforeLeave(el) {
    el.style.height = `${el.offsetHeight}px`;
    reflow(el);
  },
  onLeave(el) {
    el.style.height = "0";
    el.style.paddingTop = "0";
    el.style.paddingBottom = "0";
    el.style.marginTop = "0";
    el.style.marginBottom = "0";
  },
  onAfterLeave(el) {
    for (const prop of [
      "height",
      "paddingTop",
      "paddingBottom",
      "marginTop",
      "marginBottom",
    ] as const) {
      el.style[prop] = "";
    }
  },
};
