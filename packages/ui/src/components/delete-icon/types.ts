export type DeleteIconKind = "brush" | "cross";

export interface DeleteIconProps {
  /** 图形：brush 是旧版那支斜放的毛笔（默认），cross 是一笔叉 */
  kind?: DeleteIconKind;
  /** 边长（px），默认 32 */
  size?: number;
  /** 禁用：不响应点击、置灰 */
  disabled?: boolean;
  /** 无障碍名称，默认「删除」 */
  label?: string;
  /** 叉的笔触随机种子 */
  seed?: number;
}

export interface DeleteIconEmits {
  /** 点了图标（禁用时不触发） */
  click: [event: MouseEvent];
}
