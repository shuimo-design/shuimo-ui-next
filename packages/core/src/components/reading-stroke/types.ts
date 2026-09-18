export type ReadingStrokePosition = "top" | "bottom";

export interface ReadingStrokeProps {
  /** 笔触的随机种子；同 seed 同一根笔。默认 1 */
  seed?: number;
  /** 贴在视口顶部还是底部，默认 top */
  position?: ReadingStrokePosition;
  /** 监听哪个滚动容器：CSS 选择器、元素，或一个返回元素的函数；不传就是整页 */
  target?: string | HTMLElement | (() => HTMLElement | null);
  /** 笔宽 px，默认 4 */
  thickness?: number;
  /** 墨色，默认跟随 --m-ink */
  color?: string;
  /** 层级，默认 9000 */
  zIndex?: number;
}

export interface ReadingStrokeEmits {
  /** 进度跨过整数百分点时触发，参数是 0–1 的进度 */
  change: [progress: number];
}
