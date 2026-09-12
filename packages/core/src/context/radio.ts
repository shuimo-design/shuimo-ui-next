/**
 * 单选框组传给子项的上下文：形状 + 纯派生。字段为什么一律是纯值，见 context/checkbox.ts 的说明。
 *
 * 同样地，"没有组"是 `undefined` 而不是一份空壳：单独用的单选框直接把自己的 value 写进 v-model。
 */
import type { RadioValue } from "../components/radio/types";

export interface RadioGroupContextValue {
  /** 组当前选中的值 */
  readonly value: RadioValue | undefined;
  /** 整组禁用（已经和表单项的 disabled 合并过） */
  readonly disabled: boolean;
  /** 组内所有原生 radio 共用的 name —— 有它方向键才会在组内切换 */
  readonly name: string;
  /** 子项请求选中自己。改值、发事件、跑校验都由组自己做 */
  readonly select: (value: RadioValue) => void;
}

/** 选中的是不是这一项：在组里就比组的值，单独用就比自己的 v-model */
export function radioChecked(o: {
  group?: RadioGroupContextValue;
  own: RadioValue | undefined;
  value: RadioValue;
}): boolean {
  return (o.group ? o.group.value : o.own) === o.value;
}

/** 子项最终的禁用态：自己禁用或整组禁用 */
export function radioDisabled(o: { group?: RadioGroupContextValue; own: boolean }): boolean {
  return o.own || Boolean(o.group?.disabled);
}

/** 写到原生 input 上的 name：自己传了就用自己的，否则跟着组走 */
export function radioNativeName(o: {
  group?: RadioGroupContextValue;
  name?: string;
}): string | undefined {
  return o.name ?? o.group?.name;
}
