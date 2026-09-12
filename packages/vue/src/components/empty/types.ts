export type EmptyImage = "enso" | "ridge" | "none";

export interface EmptyProps {
  /** 说明文字，默认「暂无数据」 */
  description?: string;
  /** 插图区高度 px，默认 120 */
  imageSize?: number;
  /** 内置插图：enso 一笔圆、ridge 远山、none 不画，默认 enso */
  image?: EmptyImage;
  /** 插图的随机种子 */
  seed?: number;
}

export interface EmptySlots {
  /** 自定义插图，替换内置的 */
  image?: () => unknown;
  /** 说明文字，优先于 description */
  description?: () => unknown;
  /** 说明下面的操作区（按钮等） */
  default?: () => unknown;
}
