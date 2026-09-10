/** 内置图标名，对应 src/icons 里的单个 SFC */
export type SvgIconName =
  | "calendar"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevrons-left"
  | "chevrons-right"
  | "close"
  | "dot"
  | "eye"
  | "eye-off"
  | "loading"
  | "minus"
  | "plus"
  | "search";

export interface SvgProps {
  /** 图标名；不传则渲染默认插槽里自己写的 svg */
  name?: SvgIconName;
  /** 用笔触写出的水墨版（check / close / chevron-down / chevron-right / dot / minus / plus 有），没有笔触版的名字回落到线性版 */
  ink?: boolean;
  /** 笔触版的随机种子，默认 1（与全局素材一致） */
  seed?: number;
  /** 尺寸：数字按 px，字符串原样；默认 1em 跟随字号 */
  size?: number | string;
  /** 颜色，默认 currentColor */
  color?: string;
  /** 顺时针旋转角度 */
  rotate?: number;
  /** 持续转圈（配 loading 图标用） */
  spin?: boolean;
  /** 无障碍名称；不传按纯装饰处理（aria-hidden） */
  title?: string;
}

export interface SvgSlots {
  /** 自定义 svg 内容，name 没传时渲染 */
  default?: () => unknown;
}
