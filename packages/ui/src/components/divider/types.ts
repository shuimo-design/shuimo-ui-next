export type DividerAlign = "left" | "center" | "right";

export interface DividerProps {
  /** 竖向分割线；高度跟随父容器（flex 里自动拉伸），也可自己设 height */
  vertical?: boolean;
  /** 线中间的文字（也可用默认插槽） */
  text?: string;
  /** 文字位置，默认居中 */
  align?: DividerAlign;
  /** 笔画粗细（px），默认 4 */
  thickness?: number;
  /** 笔触随机种子：同一页多条分割线传不同种子，飞白就不会一模一样 */
  seed?: number;
}

export interface DividerSlots {
  /** 替代 text */
  default?: () => unknown;
}
