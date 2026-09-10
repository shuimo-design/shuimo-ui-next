export type TagType = "default" | "primary" | "success" | "warn" | "danger";
export type TagSize = "sm" | "md" | "lg";

export interface TagProps {
  /** 语义色：default 墨黑、primary 花青、success 石绿、warn 藤黄、danger 朱砂 */
  type?: TagType;
  /** 尺寸：sm / md / lg 对应 32 / 45 / 64px 高 */
  size?: TagSize;
  /** 任意底色，优先于 type（等价于覆盖 --m-tag-color） */
  color?: string;
  /** 显示关闭按钮 */
  closable?: boolean;
  /** 禁用（灰底、关闭按钮不可点） */
  disabled?: boolean;
  /** 关闭叉那一笔的随机种子 */
  seed?: number;
}

export interface TagEmits {
  /** 点了关闭按钮 */
  close: [event: MouseEvent];
  click: [event: MouseEvent];
}

export interface TagSlots {
  default?: () => unknown;
}
