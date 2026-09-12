/**
 * 笔触边框的无框架部分：单边开关的优先级、class 派生、笔触参数、CSS 变量。
 * Vue 和 React 的 MBorder 各自只剩一个标签和三处绑定，这里的东西两边一字不差地共用。
 */
import type { BrushBorderControllerOptions } from "../../ink/stroke";
import type { BorderProps, BorderSides } from "./types";

export type { BorderProps, BorderSides, BorderSlots } from "./types";

/** 笔触种子 */
const SEED = 1;
/** 笔宽 px：旧版是一条 2px 上下的细手绘线 */
const STROKE_WIDTH = 2;
const ROUGHNESS = 0.35;
const FLYING_WHITE = 0.06;

/**
 * 哪几条边要画：单边开关（top / right / bottom / left）优先，
 * 其次是 border 对象里的同名字段，最后才是 border 布尔值；都没说就画。
 *
 * "没传"必须是 undefined 而不是 false —— Vue 会把类型里带 boolean 的 prop 转型成 false，
 * 所以 MBorder.vue 那边给这四个显式写了 `= undefined`，见那个文件里的注释。
 */
export function borderSides(props: BorderProps): Required<BorderSides> {
  const border = props.border ?? true;
  const fallback = typeof border === "boolean" ? border : undefined;
  const pick = (own: boolean | undefined, key: keyof BorderSides) =>
    own ?? (typeof border === "object" ? (border[key] ?? true) : (fallback ?? true));
  return {
    top: pick(props.top, "top"),
    right: pick(props.right, "right"),
    bottom: pick(props.bottom, "bottom"),
    left: pick(props.left, "left"),
  };
}

export function borderClasses(props: BorderProps, sides = borderSides(props)): string[] {
  return [
    "m-border",
    ...(props.mask ? ["m-border--mask"] : []),
    ...(sides.top ? [] : ["m-border--no-top"]),
    ...(sides.right ? [] : ["m-border--no-right"]),
    ...(sides.bottom ? [] : ["m-border--no-bottom"]),
    ...(sides.left ? [] : ["m-border--no-left"]),
  ];
}

/** 喂给 createBrushBorder 的参数；不传 enabled，由控制器在落笔那一刻跟随 html.m-ink-ready */
export function borderStroke(
  props: BorderProps,
  sides = borderSides(props),
): BrushBorderControllerOptions {
  return {
    seed: props.seed ?? SEED,
    strokeWidth: props.strokeWidth ?? STROKE_WIDTH,
    roughness: props.roughness ?? ROUGHNESS,
    flyingWhite: props.flyingWhite ?? FLYING_WHITE,
    sides,
  };
}

/** 墨色和内边距交给组件私有变量，样式表里读；数字按 px */
export function borderStyle(props: BorderProps): Record<string, string> {
  const style: Record<string, string> = {};
  if (props.color) style["--m-border-color"] = props.color;
  if (props.padding !== undefined) {
    style["--m-border-padding"] =
      typeof props.padding === "number" ? `${props.padding}px` : props.padding;
  }
  return style;
}
