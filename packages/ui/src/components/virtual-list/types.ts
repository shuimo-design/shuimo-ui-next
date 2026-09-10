export interface VirtualListProps<T> {
  /** 数据 */
  list?: T[];
  /** 每项固定高度 px；传了走定高模式，不量尺寸 */
  itemHeight?: number;
  /** 变高模式下没量过的项先按这个高度估，默认 40 */
  estimatedItemHeight?: number;
  /** 可视区上下各多渲染几项做缓冲，默认 5 */
  buffer?: number;
  /** 容器高度，数字按 px，字符串原样用；不传时为 300px，也可以用 CSS 覆盖 --m-virtual-list-h */
  height?: number | string;
  /** 每项的 key；不传按下标 */
  itemKey?: (item: T, index: number) => PropertyKey;
  /** 项之间画一道分隔线 */
  divider?: boolean;
}

export interface VirtualListEmits {
  /** 滚到了底 */
  reachBottom: [];
  /** 滚动时，参数是 scrollTop */
  scroll: [top: number];
}

export interface VirtualListScope<T> {
  /** 当前项数据 */
  data: T;
  /** 当前项在 list 里的下标 */
  index: number;
}

export interface VirtualListSlots<T> {
  /** 每一项 */
  default?: (scope: VirtualListScope<T>) => unknown;
}

export type VirtualListAlign = "start" | "center" | "end" | "auto";

export interface VirtualListExpose {
  /** 滚到第 index 项；align 默认 auto（已在可视区就不动，否则滚到最近的一端） */
  scrollTo: (index: number, align?: VirtualListAlign) => void;
  /** 滚到指定 scrollTop */
  scrollToOffset: (top: number) => void;
  /** 当前 scrollTop */
  scrollTop: () => number;
}
