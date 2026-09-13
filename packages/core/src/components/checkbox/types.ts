export type CheckboxValue = string | number | boolean;

/**
 * T 是这一组复选的值类型：壳层把它接到 MCheckboxGroup 的 v-model / value 上，
 * 绑 ref<string[]>([]) 就推成 string。不带参数用就是宽联合，和以前一样
 */
export interface CheckboxProps<T extends CheckboxValue = CheckboxValue> {
  /** 放进 CheckboxGroup 时用来标识自己的值 */
  value?: T;
  /** 文字；默认插槽优先 */
  label?: string | number;
  /** 禁用 */
  disabled?: boolean;
  /** 半选态（只影响外观，不影响值） */
  indeterminate?: boolean;
  /** 原生 name */
  name?: string;
}

export interface CheckboxEmits {
  /** 用户操作导致勾选态变化 */
  change: [checked: boolean, event: Event];
}

export interface CheckboxSlots {
  /** 复选框的文字；给了就盖掉 label 属性 */
  default?: () => unknown;
}

export interface CheckboxGroupProps {
  /** 整组禁用 */
  disabled?: boolean;
  /** 至少勾选几个；到下限后剩余已选项不可取消 */
  min?: number;
  /** 最多勾选几个；到上限后未选项不可再选 */
  max?: number;
  /** 横排（默认）还是竖排 */
  direction?: "horizontal" | "vertical";
}

export interface CheckboxGroupEmits<T extends CheckboxValue = CheckboxValue> {
  /** 组内选中项变化，参数是变化后的全部选中值 */
  change: [values: T[]];
}

export interface CheckboxGroupSlots {
  /** 放 MCheckbox */
  default?: () => unknown;
}
