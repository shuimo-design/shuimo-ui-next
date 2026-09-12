export type InputType =
  | "text"
  | "password"
  | "number"
  | "email"
  | "search"
  | "tel"
  | "url"
  | "textarea";

/** textarea 右下角能不能拖着改大小 */
export type InputResize = "none" | "both" | "horizontal" | "vertical";

export interface InputProps {
  /** 原生 type；textarea 时渲染多行文本框 */
  type?: InputType;
  /** 占位文字 */
  placeholder?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 只读 */
  readonly?: boolean;
  /** 有内容时显示清空按钮 */
  clearable?: boolean;
  /** password 时显示"看一眼"切换按钮 */
  showPassword?: boolean;
  /** 最大字数（原生 maxlength） */
  maxlength?: number;
  /** 显示字数统计；有 maxlength 时显示为 `n / max` */
  showCount?: boolean;
  /** textarea 行数，默认 3 */
  rows?: number;
  /** textarea 能否拖拽改大小，默认 vertical */
  resize?: InputResize;
  /** 原生 name */
  name?: string;
  /** 原生 autocomplete */
  autocomplete?: string;
  /** 挂载后自动聚焦 */
  autofocus?: boolean;
}

export interface InputEmits {
  /** 每次输入 */
  input: [value: string];
  /** 值提交（原生 change：失焦或回车） */
  change: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  /** 点了清空按钮 */
  clear: [];
}

export interface InputSlots {
  /** 输入框前的内容（图标、单位） */
  prefix?: () => unknown;
  /** 输入框后的内容 */
  suffix?: () => unknown;
}

export interface InputExpose {
  focus: () => void;
  blur: () => void;
  select: () => void;
}
