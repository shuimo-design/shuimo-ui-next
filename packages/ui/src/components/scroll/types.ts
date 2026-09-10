export interface ScrollProps {
  /** 视口高度，数字按 px；不传则由外层容器（或自身 CSS）决定 */
  height?: string | number;
  /** 视口最大高度，数字按 px；内容不够高时不撑满 */
  maxHeight?: string | number;
  /** 一直显示滚动条；默认只在悬停、滚动、拖动时浮现 */
  always?: boolean;
  /** 滑块最短长度 px，默认 20，内容极长时滑块也不会缩成一点 */
  minThumb?: number;
}

export interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
}

export interface ScrollEmits {
  /** 视口滚动时触发，参数是当前滚动位置 */
  scroll: [position: ScrollPosition];
}

export interface ScrollSlots {
  /** 要滚动的内容 */
  default?: () => unknown;
}
