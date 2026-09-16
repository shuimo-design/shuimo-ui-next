/**
 * 气泡确认的无框架部分。开合时序在 overlay/popover-trigger.ts、定位在 overlay/floating.ts、
 * 焦点搬运在 overlay/popover-focus.ts；这里只剩 class 派生、墨尖与徽记的素材、
 * 参照元素上的 aria，以及两句默认文案（和 MConfirm 同一份）。
 */
import { inkBadgeUrl } from "../../ink/assets/badge";
import { inkTipUrl } from "../../ink/assets/tip";
import { CONFIRM_CANCEL_TEXT, CONFIRM_OK_TEXT } from "../confirm";
import { POPOVER_BORDER_STROKE } from "../popover";
import type { PopconfirmProps } from "./types";

export type {
  PopconfirmEmits,
  PopconfirmPlacement,
  PopconfirmProps,
  PopconfirmSlots,
} from "./types";

export const POPCONFIRM_OK_TEXT = CONFIRM_OK_TEXT;
export const POPCONFIRM_CANCEL_TEXT = CONFIRM_CANCEL_TEXT;

/** 气泡确认的框和气泡卡片是同一支笔 */
export const POPCONFIRM_BORDER_STROKE = POPOVER_BORDER_STROKE;

export function popconfirmClasses(state: {
  wrapOnly: boolean;
  open: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-popconfirm",
    ...(state.wrapOnly ? ["m-popconfirm--wrap"] : []),
    ...(state.open ? ["m-popconfirm--open"] : []),
    ...(state.disabled ? ["m-popconfirm--disabled"] : []),
  ];
}

/**
 * 浮层容器上的素材：指向参照元素的墨尖（和气泡卡片同尺寸），
 * 以及标题左侧的提示徽记 —— 一团墨里挖出感叹号，和 MAlert 的 warning 徽记是同一张
 */
export function popconfirmStyle(props: Pick<PopconfirmProps, "seed">): Record<string, string> {
  const seed = props.seed ?? 1;
  return {
    "--m-popconfirm-tip": `url("${inkTipUrl({ seed, width: 14, height: 7 })}")`,
    "--m-popconfirm-badge": `url("${inkBadgeUrl("bang", { seed })}")`,
  };
}

/** 参照元素上的 aria：按下去会弹一个对话框。返回 undefined 的属性要摘掉 */
export function popconfirmReferenceAria(state: { open: boolean; panelId: string }): {
  "aria-haspopup": string;
  "aria-expanded": string;
  "aria-controls"?: string;
} {
  return {
    "aria-haspopup": "dialog",
    "aria-expanded": String(state.open),
    ...(state.open ? { "aria-controls": state.panelId } : {}),
  };
}

/** popconfirmReferenceAria 管的那几个属性，用来在参照元素换人时逐个摘干净 */
export const POPCONFIRM_REFERENCE_ARIA = [
  "aria-haspopup",
  "aria-expanded",
  "aria-controls",
] as const;

/** 打开后焦点落在取消按钮上：误触回车不会把危险操作确认掉 */
export function popconfirmFocusTarget(panel: HTMLElement): HTMLElement | null {
  return panel.querySelector<HTMLElement>(".m-popconfirm__cancel");
}
