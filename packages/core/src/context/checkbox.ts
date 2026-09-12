/**
 * 复选框组传给子项的上下文：形状 + 纯派生。
 *
 * 为什么要重画一遍形状：原来 Vue 里的字段是 `Ref<T>` 和取值函数（`canCheck: () => boolean`），
 * 那是 Vue 响应式的产物 —— 父组件改了值，子组件在模板里读 `.value` 时才重新求值。
 * React 里没有这套依赖收集，getter 不会触发重渲染，直接搬过去会静默失效。
 * 所以这里字段一律是**纯值**：值变了就换一份新的上下文对象，两个框架各自照自己的规矩重渲染。
 *
 * "没有组"和"空组"是两回事：单独用的复选框靠自己的 v-model / value 记状态，
 * 所以上下文的默认值是 `undefined`（Vue 的 inject 默认值、React 的 createContext 初值都用它），
 * 不是一份空壳 —— 有空壳的话子项就分不清自己该听谁的了。
 */
import type { CheckboxValue } from "../components/checkbox/types";

export interface CheckboxGroupContextValue {
  /** 组当前选中的值 */
  readonly values: readonly CheckboxValue[];
  /** 整组禁用（已经和表单项的 disabled 合并过） */
  readonly disabled: boolean;
  /** 至少勾几个；到下限后已选项不能再取消 */
  readonly min?: number;
  /** 最多勾几个；到上限后未选项不能再勾 */
  readonly max?: number;
  /** 子项请求切换自己。改值、发事件、跑校验都由组自己做 */
  readonly toggle: (value: CheckboxValue, checked: boolean) => void;
}

/** 组里是否已选中这个值。`value` 没给（子项没声明自己代表哪个值）时一律算没选 */
export function checkboxGroupHas(
  group: CheckboxGroupContextValue,
  value: CheckboxValue | undefined,
): boolean {
  return value !== undefined && group.values.includes(value);
}

/** 还能不能再勾一个（max 限制） */
export function checkboxGroupCanCheck(group: CheckboxGroupContextValue): boolean {
  return group.max === undefined || group.values.length < group.max;
}

/** 还能不能取消一个（min 限制） */
export function checkboxGroupCanUncheck(group: CheckboxGroupContextValue): boolean {
  return group.min === undefined || group.values.length > group.min;
}

/** 勾上 / 取消之后组的新值。纯函数，永远返回新数组，不改入参 */
export function nextCheckboxValues(
  values: readonly CheckboxValue[],
  value: CheckboxValue,
  checked: boolean,
): CheckboxValue[] {
  if (!checked) return values.filter((v) => v !== value);
  return values.includes(value) ? [...values] : [...values, value];
}

/**
 * 子项最终的勾选态：在组里就听组的，单独用就听自己的 v-model。
 * 子项没声明 `value` 时即使在组里也算单独用 —— 组认不出它是谁。
 */
export function checkboxChecked(o: {
  group?: CheckboxGroupContextValue;
  value?: CheckboxValue;
  own: boolean;
}): boolean {
  if (o.group && o.value !== undefined) return checkboxGroupHas(o.group, o.value);
  return o.own;
}

/**
 * 子项最终的禁用态：自己禁用、整组禁用，或者组的 min/max 把这一项锁住了。
 * `checked` 传上面算出来的结果，免得重算一遍。
 */
export function checkboxDisabled(o: {
  group?: CheckboxGroupContextValue;
  value?: CheckboxValue;
  own: boolean;
  checked: boolean;
}): boolean {
  if (o.own || o.group?.disabled) return true;
  if (o.group && o.value !== undefined) {
    return o.checked ? !checkboxGroupCanUncheck(o.group) : !checkboxGroupCanCheck(o.group);
  }
  return false;
}
