/**
 * 进度条的无框架部分：百分比的钳制与取整、class 派生、粗细变量、外框笔触参数。
 * 两个壳只剩模板和 ref 接线，算出来的数字一字不差地共用。
 */
import type { BrushBorderControllerOptions } from "../../ink/stroke";
import type { ProgressProps } from "./types";

export type { ProgressProps, ProgressStatus } from "./types";

/** 外框是一圈细笔触（对应旧版 MBorder 的手绘框），进度条本体是框里一段实墨 */
export function progressBrush(): BrushBorderControllerOptions {
  return { strokeWidth: 1.5, seed: 3 };
}

export interface ProgressValue {
  /** 钳到 [0, max] 里的当前值，直接给 aria-valuenow */
  clamped: number;
  /** 0–100 之间、最多两位小数的百分比，条宽和文字都用它 */
  percent: number;
  /** 归一化后的最大值，给 aria-valuemax */
  max: number;
}

/**
 * 值超出范围要收回来（旧库允许传 250/100，画出来是满格），
 * 百分比最多留两位小数；`Number()` 再把 33.30 这类多余的 0 去掉。
 */
export function progressValue(props: ProgressProps): ProgressValue {
  const { value = 0, max = 100 } = props;
  const clamped = Math.min(Math.max(value, 0), Math.max(max, 0));
  return {
    clamped,
    percent: max > 0 ? Number(((clamped / max) * 100).toFixed(2)) : 0,
    max,
  };
}

export function progressClasses(props: ProgressProps, percent: number): string[] {
  const { status = "default" } = props;
  return ["m-progress", `m-progress--${status}`, ...(percent >= 100 ? ["m-progress--done"] : [])];
}

/** 条的粗细走 CSS 变量，框高由 CSS 按 `粗细 + 留白 × 2` 算 */
export function progressVars(props: ProgressProps): Record<string, string> {
  const { strokeWidth = 7 } = props;
  return { "--m-progress-h": `${strokeWidth}px` };
}

/** 默认在条上显示百分比文字 */
export function progressShowInfo(props: ProgressProps): boolean {
  return props.showInfo ?? true;
}

/** 条本身的宽度，百分比字符串 */
export function progressBarStyle(percent: number): Record<string, string> {
  return { width: `${percent}%` };
}
