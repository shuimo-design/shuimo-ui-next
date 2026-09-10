export type ButtonType = "default" | "primary" | "confirm" | "error" | "warning" | "text";

export interface ButtonProps {
  /** 按钮语义类型：default 灰蓝、primary 蓝、confirm 青、error 红、warning 黄，都是实色块；text 只有文字 */
  type?: ButtonType;
  /** 按钮文字，有默认插槽时被插槽覆盖 */
  text?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 加载中：文字前出现旋转墨点，期间不响应点击 */
  loading?: boolean;
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
