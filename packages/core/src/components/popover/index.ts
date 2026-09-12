/**
 * 气泡的无框架部分。开合时序在 overlay/popover-trigger.ts、定位在 overlay/floating.ts，
 * 这里只剩 class 派生、墨尖箭头的素材，以及参照元素上那两个 aria 属性该怎么写。
 */
import { inkTipUrl } from "../../ink/assets/tip";
import type { PopoverProps } from "./types";

export type {
  PopoverEmits,
  PopoverPlacement,
  PopoverProps,
  PopoverSlots,
  PopoverTrigger,
} from "./types";

export function popoverClasses(state: {
  wrapOnly: boolean;
  open: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-popover",
    ...(state.wrapOnly ? ["m-popover--wrap"] : []),
    ...(state.open ? ["m-popover--open"] : []),
    ...(state.disabled ? ["m-popover--disabled"] : []),
  ];
}

/** 指向参照元素的墨尖箭头，14×7 的一小片（比提示的 12×6 大一号，气泡的框也更厚） */
export function popoverTipStyle(props: Pick<PopoverProps, "seed">): Record<string, string> {
  return {
    "--m-popover-tip": `url("${inkTipUrl({ seed: props.seed ?? 1, width: 14, height: 7 })}")`,
  };
}

/** 笔触边框的参数：气泡的框和提示一样细 */
export const POPOVER_BORDER_STROKE = 1.5;

/**
 * 参照元素上要写的展开态：只有 click 触发才写。
 * hover / focus 弹出的气泡不是「这个按钮控制着一块内容」，写上 aria-expanded 反而误导读屏。
 * 返回 undefined 表示这个属性要摘掉——两个壳都按同一份结果 setAttribute / removeAttribute。
 */
export function popoverReferenceAria(state: { trigger: string; open: boolean; panelId: string }): {
  "aria-expanded"?: string;
  "aria-controls"?: string;
} {
  if (state.trigger !== "click") return {};
  return {
    "aria-expanded": String(state.open),
    ...(state.open ? { "aria-controls": state.panelId } : {}),
  };
}

/** popoverReferenceAria 管的那几个属性，用来在参照元素换人时逐个摘干净 */
export const POPOVER_REFERENCE_ARIA = ["aria-expanded", "aria-controls"] as const;
