export type RadioValue = string | number | boolean;

export interface RadioProps {
  /** 这一项代表的值；选中后写进 v-model */
  value: RadioValue;
  /** 文字；默认插槽优先 */
  label?: string | number;
  /** 禁用 */
  disabled?: boolean;
  /** 原生 name；在 RadioGroup 里时以组的 name 为准 */
  name?: string;
}

export interface RadioEmits {
  /** 用户操作选中了这一项 */
  change: [value: RadioValue, event: Event];
}

export interface RadioSlots {
  default?: () => unknown;
}

export interface RadioGroupProps {
  /** 整组禁用 */
  disabled?: boolean;
  /** 横排（默认）还是竖排 */
  direction?: "horizontal" | "vertical";
  /** 组内所有原生 radio 共用的 name；不传则自动生成，保证方向键能在组内切换 */
  name?: string;
}

export interface RadioGroupEmits {
  /** 用户操作导致选中项变化 */
  change: [value: RadioValue];
}

export interface RadioGroupSlots {
  default?: () => unknown;
}
