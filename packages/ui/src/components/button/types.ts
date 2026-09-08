export type ButtonType = "default" | "primary" | "confirm" | "cancel" | "text";

export interface ButtonProps {
  /** 按钮语义类型，决定墨色与笔触 */
  type?: ButtonType;
  /** 禁用 */
  disabled?: boolean;
  /** 渲染为 a 标签时的链接地址 */
  href?: string;
  /** 原生 button 的 type */
  nativeType?: "button" | "submit" | "reset";
}

export interface ButtonEmits {
  click: [event: MouseEvent];
}

export interface ButtonSlots {
  default?: () => unknown;
}
