/**
 * 图标外壳的无框架部分：哪些名字有笔触版、class 与内联变量的派生。
 * "图标名 → 线性图标组件" 那张表没法下沉（值是框架组件），留在两个壳里各一份。
 */
import { inkMarkUrl, type InkMarkKind } from "../../ink/assets/mark";
import type { SvgIconName, SvgProps } from "./types";

export type { SvgIconName, SvgProps } from "./types";

/** 有笔触版的图标名 → 素材库里的记号种类；没列的只有线性版 */
export const SVG_INK_MARKS: Partial<Record<SvgIconName, InkMarkKind>> = {
  check: "check",
  close: "cross",
  "chevron-down": "chevronDown",
  "chevron-right": "chevronRight",
  dot: "dot",
  minus: "minus",
  plus: "plus",
};

/** 只有素材库里有对应记号的名字才走笔触版，其余静默回落到线性版 */
export function svgInkKind(props: SvgProps): InkMarkKind | undefined {
  return props.ink && props.name ? SVG_INK_MARKS[props.name] : undefined;
}

export function svgClasses(o: { spin?: boolean; inkKind?: InkMarkKind }): string[] {
  return ["m-svg", ...(o.spin ? ["m-svg--spin"] : []), ...(o.inkKind ? ["m-svg--ink"] : [])];
}

/**
 * 尺寸跟着字号走（数字按 px，字符串原样），所以这里给的是 fontSize 不是 width/height；
 * 旋转角度落在根元素上，转圈动画落在内容上（见 svg.css），两者互不覆盖。
 * 值为 undefined 的键两个框架都会忽略，等于没写。
 */
export function svgStyle(o: {
  size?: number | string;
  color?: string;
  rotate?: number;
  seed?: number;
  inkKind?: InkMarkKind;
}): Record<string, string | undefined> {
  return {
    fontSize: typeof o.size === "number" ? `${o.size}px` : o.size,
    color: o.color,
    "--m-svg-rotate": o.rotate ? `${o.rotate}deg` : undefined,
    "--m-svg-mask": o.inkKind
      ? `url("${inkMarkUrl(o.inkKind, { seed: o.seed ?? 1 })}")`
      : undefined,
  };
}
