export type RadioValue = string | number | boolean;

/**
 * T 是这一组单选的值类型：壳层把它接到 v-model / value 上，绑 ref("a") 就推成 string，
 * 不再是 string | number | boolean 的宽联合。不带参数用就是宽联合，和以前一样
 */
export interface RadioProps<T extends RadioValue = RadioValue> {
  /** 这一项代表的值；选中后写进 v-model */
  value: T;
  /** 文字；默认插槽优先 */
  label?: string | number;
  /** 禁用 */
  disabled?: boolean;
  /** 原生 name；在 RadioGroup 里时以组的 name 为准 */
  name?: string;
}

export interface RadioEmits<T extends RadioValue = RadioValue> {
  /** 用户操作选中了这一项 */
  change: [value: T, event: Event];
}

export interface RadioSlots {
  /** 单选框的文字；给了就盖掉 label 属性 */
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

export interface RadioGroupEmits<T extends RadioValue = RadioValue> {
  /** 用户操作导致选中项变化 */
  change: [value: T];
}

export interface RadioGroupSlots {
  /** 放 MRadio */
  default?: () => unknown;
}
