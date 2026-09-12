export type AvatarVariant = "circle" | "square";
export type AvatarSize = "sm" | "md" | "lg" | number;

export interface AvatarProps {
  /** 图片地址；不传或加载失败时显示默认插槽，插槽也没有就显示人形图标 */
  src?: string;
  /** 图片替代文字，也作为兜底内容的无障碍名称 */
  alt?: string;
  /** 形状：circle 一笔墨圈（默认），square 笔触方框 */
  variant?: AvatarVariant;
  /** 尺寸：sm / md / lg 对应 24 / 40 / 50px，也可直接传像素数 */
  size?: AvatarSize;
  /** 墨圈 / 方框 / 毛边遮罩的随机种子，同一页多个头像可以各给一个 */
  seed?: number;
}

export interface AvatarEmits {
  /** 图片加载失败 */
  error: [event: Event];
}

export interface AvatarSlots {
  /** 无图或图片加载失败时的兜底内容，例如文字缩写或图标 */
  default?: () => unknown;
}
