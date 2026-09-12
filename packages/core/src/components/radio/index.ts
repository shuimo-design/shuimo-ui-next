/**
 * 单选框的无框架部分：class 派生和两张墨迹遮罩（外圈的墨圈、选中后的墨点）。
 * 组的取值规则（谁是选中的、共用哪个 name）在 context/radio.ts。
 * Vue 和 React 的单选框各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkCircleUrl } from "../../ink/assets/circle";
import type { RadioGroupProps } from "./types";

export type { RadioGroupProps, RadioProps, RadioValue } from "./types";

/**
 * 外圈是一笔绕出来的墨圈（左上有接头、右下最饱），选中后中心落一团毛边墨点。
 * 都按 2 倍画幅生成再缩到 20px 左右，晕染位移才不会把小圆撕散。
 *
 * 两张图不随 props 变，整个模块只生成一次；每个单选框内联这一份变量即可
 * （几十字节，不值得走素材登记），内联也让服务端和首帧输出一致，水合不会报不匹配。
 */
const INK_STYLE: Record<string, string> = {
  "--m-radio-ring-mask": `url("${inkCircleUrl({ seed: 5, size: 40, thickness: 4.4, raggedness: 0.55 })}")`,
  "--m-radio-dot-mask": `url("${inkBlobUrl({ seed: 5, size: 24, radius: 0.4, raggedness: 0.16 })}")`,
};

export function radioInk(): Record<string, string> {
  return INK_STYLE;
}

export function radioClasses(o: { checked: boolean; disabled?: boolean }): string[] {
  return [
    "m-radio",
    ...(o.checked ? ["m-radio--checked"] : []),
    ...(o.disabled ? ["m-radio--disabled"] : []),
  ];
}

export function radioGroupClasses(props: RadioGroupProps): string[] {
  return ["m-radio-group", `m-radio-group--${props.direction ?? "horizontal"}`];
}

/** 有没有文字要显示：插槽 / children 优先，其次 label。数字 0 也是文字，所以比的是 undefined */
export function radioHasLabel(label: string | number | undefined, hasSlot: boolean): boolean {
  return hasSlot || label !== undefined;
}
