export interface InputNumberProps {
  /** 最小值，默认 -Infinity */
  min?: number;
  /** 最大值，默认 Infinity */
  max?: number;
  /** 按钮 / 方向键每次增减的量，默认 1 */
  step?: number;
  /** 小数位数；不传则不限制 */
  precision?: number;
  /** 禁用 */
  disabled?: boolean;
  /** 只读：不能键入也不能用按钮增减 */
  readonly?: boolean;
  /** 占位文字 */
  placeholder?: string;
  /** 两侧显示减 / 加按钮，默认 true */
  controls?: boolean;
  /** 原生 name */
  name?: string;
}

export interface InputNumberEmits {
  /** 值提交后（失焦、回车、按钮或方向键增减），参数是新值与旧值 */
  change: [value: number | undefined, oldValue: number | undefined];
  /** 每次键入，参数是清洗后的文本（可能是 `-`、`1.` 这类中间态） */
  input: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}

export interface InputNumberExpose {
  focus: () => void;
  blur: () => void;
  select: () => void;
}
