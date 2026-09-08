export interface BorderProps {
  /** 笔触种子，默认 1 */
  seed?: number;
  /** 笔宽 px，默认 3 */
  strokeWidth?: number;
  /** 边缘噪声 0–1 */
  roughness?: number;
  /** 飞白 0–1 */
  flyingWhite?: number;
  /** 渲染标签，默认 div */
  tag?: string;
}

export interface BorderSlots {
  default?: () => unknown;
}
