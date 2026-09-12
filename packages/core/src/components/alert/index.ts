/**
 * 提示条的无框架部分：class 派生、状态徽记的墨迹参数、左侧色边的笔触线参数。
 *
 * 收起动画不在这里 —— 它是通用的"钉高度再收 0"，写在 transition/collapse.ts 里，
 * 两个壳各自把那一份钩子交给自己框架的过渡宿主（Vue 的 <Transition>、React 的 MTransition）。
 */
import { inkBadgeUrl, type InkBadgeKind } from "../../ink/assets/badge";
import type { BrushLineControllerOptions } from "../divider";
import type { AlertProps, AlertType } from "./types";

export type { AlertEffect, AlertEmits, AlertProps, AlertSlots, AlertType } from "./types";

/** 笔触线和徽记的随机种子默认值 */
const SEED = 1;
/** 左侧色边的笔画粗细（px），和 CSS 里的 --m-alert-bar-thickness 是同一个数 */
const BAR_THICKNESS = 3;

/** 四种语义各用素材库里的哪个记号：对勾、叹号、叉、信息点 */
const BADGE: Record<AlertType, InkBadgeKind> = {
  success: "check",
  warn: "bang",
  danger: "cross",
  info: "info",
};

/** 关闭按钮的无障碍名 */
export const ALERT_CLOSE_LABEL = "关闭";

export function alertClasses(o: {
  type?: AlertType;
  effect?: AlertProps["effect"];
  center?: boolean;
  /** 有标题（title 属性或标题插槽） */
  hasTitle: boolean;
  /** 有说明（description 属性或默认插槽） */
  hasDescription: boolean;
}): string[] {
  const { type = "info", effect = "light", center = false } = o;
  return [
    "m-alert",
    `m-alert--${type}`,
    `m-alert--${effect}`,
    ...(center ? ["m-alert--center"] : []),
    ...(o.hasTitle ? ["m-alert--with-title"] : []),
    ...(o.hasDescription ? ["m-alert--with-description"] : []),
  ];
}

/** 状态徽记：一团墨里挖出记号，当 mask 用，颜色由 CSS 跟着语义色走 */
export function alertStyle(o: { type?: AlertType; seed?: number }): Record<string, string> {
  const type = o.type ?? "info";
  return {
    "--m-alert-badge": `url("${inkBadgeUrl(BADGE[type], { seed: o.seed ?? SEED })}")`,
  };
}

/** 左边那条色边：按整条提示的实际高度单独生成一根竖向笔触线 */
export function alertBarLine(seed?: number): BrushLineControllerOptions {
  return { thickness: BAR_THICKNESS, vertical: true, seed: seed ?? SEED };
}
