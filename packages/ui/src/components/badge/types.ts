export type BadgeType = "primary" | "success" | "warn" | "danger" | "info";

export interface BadgeProps {
  /** 显示的数字或文字；数字超过 max 显示 "max+" */
  value?: number | string;
  /** 数字上限，默认 99 */
  max?: number;
  /** 只显示一个小点，不显示数字 */
  dot?: boolean;
  /** 隐藏角标 */
  hidden?: boolean;
  /** 语义色，默认 danger（朱砂印泥色） */
  type?: BadgeType;
  /** 位移 [x, y]，单位 px，在默认位置（内容右上角）基础上叠加 */
  offset?: [number, number];
  /** value 为 0 时也显示，默认 false */
  showZero?: boolean;
  /** 水墨层小印毛边、印泥纹理和小点的随机种子；同一页多个角标可以各给一个，默认 1 */
  seed?: number;
}

export interface BadgeSlots {
  /** 被标注的内容；不传时角标独立显示，不做绝对定位 */
  default?: () => unknown;
}
