/**
 * 确认框的无框架部分。它基本就是弹窗的特例：滚动锁、模态栈、ESC、焦点存还、Tab 循环
 * 全用 overlay/modal.ts 那一份控制器，这里只剩类名、笔触参数和两句默认文案。
 */
import type { BrushBorderControllerOptions } from "../../ink/stroke";

export type * from "./types";

/** 过渡类名前缀，CSS 里写死的就是这套；两个壳必须产出同一串类名 */
export const CONFIRM_TRANSITION = "m-confirm";
export const CONFIRM_OK_TEXT = "确定";
export const CONFIRM_CANCEL_TEXT = "取消";

/** 面板外框那一笔：比弹窗细，确认框本来就小一号 */
export function confirmBrush(seed: number): BrushBorderControllerOptions {
  return { seed, strokeWidth: 3 };
}

export function confirmClasses(maskShow: boolean): string[] {
  const classes = ["m-confirm"];
  if (maskShow) classes.push("m-confirm--mask");
  return classes;
}
