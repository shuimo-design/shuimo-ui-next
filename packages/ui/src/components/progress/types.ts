export type ProgressStatus = "default" | "success" | "warn" | "danger";

export interface ProgressProps {
  /** 当前值 */
  value?: number;
  /** 最大值；百分比 = value / max */
  max?: number;
  /** 在条上居中显示百分比文字，默认 true */
  showInfo?: boolean;
  /** 语义状态，决定条的颜色 */
  status?: ProgressStatus;
  /** 条的粗细（px），默认 7；框高 = 粗细 + 10 */
  strokeWidth?: number;
}

export interface ProgressSlots {
  /** 替代百分比文字；percent 是 0–100 之间、最多两位小数的数 */
  default?: (props: { percent: number }) => unknown;
}
