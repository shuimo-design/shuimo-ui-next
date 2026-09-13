export type CheckboxValue = string | number | boolean;

export interface CheckboxProps {
  /** 放进 CheckboxGroup 时用来标识自己的值 */
  value?: CheckboxValue;
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

export interface CheckboxGroupEmits {
  /** 组内选中项变化，参数是变化后的全部选中值 */
  change: [values: CheckboxValue[]];
}

export interface CheckboxGroupSlots {
  /** 放 MCheckbox */
  default?: () => unknown;
}
