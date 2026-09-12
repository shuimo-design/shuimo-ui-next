/**
 * 提示的无框架部分。开合时序在 overlay/popover-trigger.ts、定位在 overlay/floating.ts，
 * 这里只剩 class 派生和墨尖箭头的素材。
 */
import { inkTipUrl } from "../../ink/assets/tip";
import type { TooltipProps } from "./types";

export type {
  TooltipEmits,
  TooltipPlacement,
  TooltipProps,
  TooltipSlots,
  TooltipTrigger,
} from "./types";

export function tooltipClasses(state: {
  wrapOnly: boolean;
  open: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-tooltip",
    ...(state.wrapOnly ? ["m-tooltip--wrap"] : []),
    ...(state.open ? ["m-tooltip--open"] : []),
    ...(state.disabled ? ["m-tooltip--disabled"] : []),
  ];
}

/** 指向参照元素的墨尖箭头，12×6 的一小片 */
export function tooltipTipStyle(props: Pick<TooltipProps, "seed">): Record<string, string> {
  return {
    "--m-tooltip-tip": `url("${inkTipUrl({ seed: props.seed ?? 1, width: 12, height: 6 })}")`,
  };
}

/** 笔触边框的参数：提示的框比一般组件细 */
export const TOOLTIP_BORDER_STROKE = 1.5;
