/**
 * 输入框的无框架部分：显示文本归一化、字数统计、原生 type 派生、后缀区要不要出现、
 * class 与根元素变量，以及"点在外框空白处把焦点送进输入框"的判定。
 * Vue 和 React 的输入框各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import type { BrushBorderOptions } from "../../ink/stroke";
import { FIELD_STROKE } from "../field-stroke";
import type { InputResize, InputType } from "./types";

export type { InputProps, InputResize, InputType } from "./types";

/** 外框换成一笔细笔触，参数与其他表单控件共用；聚焦 / 禁用只换墨色（见 input.css 的 m.ink 层） */
export function inputBrush(): BrushBorderOptions {
  return FIELD_STROKE;
}

/** 三个操作按钮的无障碍名称，两个壳必须一致 */
export const INPUT_CLEAR_LABEL = "清空";
export const INPUT_PASSWORD_SHOW_LABEL = "显示密码";
export const INPUT_PASSWORD_HIDE_LABEL = "隐藏密码";

/** 后缀区里的操作按钮；点在它上面时不抢焦点 */
const ACTION_SELECTOR = ".m-input__action";

/** 模板里不带类型地绑一个数字很常见，显示前统一转成字符串，免得 .length 之类在数字上炸掉 */
export function inputText(value: unknown): string {
  return String(value ?? "");
}

/** 按字符（码点）数，emoji 这类算一个字 */
export function inputCount(text: string): number {
  return Array.from(text).length;
}

/** 字数统计那行文字：有上限时显示成 `n / max` */
export function inputCountText(count: number, maxlength?: number): string {
  return maxlength === undefined ? String(count) : `${count} / ${maxlength}`;
}

export function inputIsTextarea(type: InputType = "text"): boolean {
  return type === "textarea";
}

/** textarea 没有 type；password 点了"看一眼"临时变成 text */
export function inputNativeType(
  type: InputType = "text",
  passwordVisible = false,
): string | undefined {
  if (type === "password" && passwordVisible) return "text";
  return inputIsTextarea(type) ? undefined : type;
}

export function inputShowClear(o: {
  clearable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  text: string;
}): boolean {
  return Boolean(o.clearable) && !o.disabled && !o.readonly && o.text.length > 0;
}

export function inputShowEye(o: {
  type?: InputType;
  showPassword?: boolean;
  disabled?: boolean;
}): boolean {
  return o.type === "password" && Boolean(o.showPassword) && !o.disabled;
}

/** 后缀区只要有一样东西就得渲染出来（单行的字数也落在后缀区里） */
export function inputHasSuffix(o: {
  showClear: boolean;
  showEye: boolean;
  hasSuffixSlot: boolean;
  showCount?: boolean;
  isTextarea: boolean;
}): boolean {
  return o.showClear || o.showEye || o.hasSuffixSlot || (Boolean(o.showCount) && !o.isTextarea);
}

export function inputClasses(o: {
  type?: InputType;
  disabled?: boolean;
  readonly?: boolean;
  focused: boolean;
  isTextarea: boolean;
  hasPrefix: boolean;
  hasSuffix: boolean;
  showCount?: boolean;
}): string[] {
  const type = o.type ?? "text";
  return [
    "m-input",
    `m-input--${type}`,
    ...(o.disabled ? ["m-input--disabled"] : []),
    ...(o.readonly ? ["m-input--readonly"] : []),
    ...(o.focused ? ["m-input--focused"] : []),
    ...(o.isTextarea ? ["m-input--textarea"] : []),
    ...(o.hasPrefix ? ["m-input--with-prefix"] : []),
    ...(o.hasSuffix ? ["m-input--with-suffix"] : []),
    ...(o.showCount ? ["m-input--with-count"] : []),
  ];
}

/** textarea 能不能拖着改大小走变量，用户也能用 CSS 覆盖 */
export function inputStyle(resize: InputResize = "vertical"): Record<string, string> {
  return { "--m-input-resize": resize };
}

/**
 * 点在外框空白处也把焦点送进输入框，和点在文字上一样。
 * 点在原生元素自己身上（浏览器已经会聚焦）、禁用时、点在后缀区的按钮上都不接管。
 */
export function inputRedirectFocus(o: {
  target: HTMLElement | null;
  native: HTMLElement | null;
  disabled?: boolean;
}): boolean {
  if (o.disabled || !o.target || o.target === o.native) return false;
  return o.target.closest(ACTION_SELECTOR) === null;
}
