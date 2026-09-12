/**
 * 删除图标的无框架部分：类型、class 与变量派生，以及那支毛笔的几何。
 * 笔的路径只在这里写一份 —— 两边各内联一次的话，改了一处另一处就悄悄漂移了。
 */
import type { IconShape } from "../../icons";
import { inkMarkUrl } from "../../ink/assets/mark";
import type { DeleteIconKind, DeleteIconProps } from "./types";

export type { DeleteIconKind, DeleteIconProps } from "./types";

/** 无障碍名称的默认值 */
export const DELETE_ICON_LABEL = "删除";

/**
 * 一支斜放的毛笔（笔尖朝左上）：先横着画，再整体转 45°。
 * 画幅 32×32，转角就是画幅中心，所以 viewBox 和 transform 一起写在这里。
 */
export const DELETE_ICON_BRUSH_VIEW_BOX = "0 0 32 32";
export const DELETE_ICON_BRUSH_TRANSFORM = "rotate(45 16 16)";
export const DELETE_ICON_BRUSH_SHAPES: readonly IconShape[] = [
  {
    tag: "path",
    attrs: { d: "M0.8 16 C3 13.8 6 12.2 9.2 11.9 L10.6 16 L9.2 20.1 C6 19.8 3 18.2 0.8 16 Z" },
  },
  { tag: "rect", attrs: { x: "10.2", y: "12.3", width: "2.6", height: "7.4", rx: "0.6" } },
  { tag: "path", attrs: { d: "M12.8 12.8 L27.4 13.8 L27.4 18.2 L12.8 19.2 Z" } },
  {
    tag: "path",
    attrs: {
      class: "m-delete-icon__gloss",
      d: "M14.4 14.5 L26.2 15.2",
      fill: "none",
      "stroke-width": "0.9",
      "stroke-linecap": "round",
    },
  },
  { tag: "rect", attrs: { x: "27.4", y: "13.6", width: "1.6", height: "4.8", rx: "0.5" } },
  {
    tag: "circle",
    attrs: {
      cx: "30.4",
      cy: "16",
      r: "1.5",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.2",
    },
  },
];

export function deleteIconClasses(props: DeleteIconProps): string[] {
  const { kind = "brush", disabled = false } = props;
  return [
    "m-delete-icon",
    `m-delete-icon--${kind}`,
    ...(disabled ? ["m-delete-icon--disabled"] : []),
  ];
}

/** 禁用时吞掉点击：原生 disabled 挡不住程序派发的事件 */
export function deleteIconInert(props: DeleteIconProps): boolean {
  return props.disabled === true;
}

/**
 * 叉用素材库那一笔；写成组件自己的变量而不用 --m-ink-mark-cross，没开 ink 引擎时也有图。
 * 毛笔版不需要遮罩，就不生成。
 */
export function deleteIconStyle(o: {
  kind?: DeleteIconKind;
  size?: number;
  seed?: number;
}): Record<string, string> {
  const { kind = "brush", size = 32, seed = 1 } = o;
  return {
    "--m-delete-icon-size": `${size}px`,
    ...(kind === "cross"
      ? { "--m-delete-icon-cross": `url("${inkMarkUrl("cross", { seed, strokeWidth: 3 })}")` }
      : {}),
  };
}
