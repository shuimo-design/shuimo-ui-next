import type { TreeEmits, TreeKey, TreeLabelScope, TreeProps } from "../tree/types";
import type { VirtualListAlign } from "../virtual-list/types";

/**
 * 虚拟树的 props：树的部分（数据、勾选、展开、选中）与 MTree 完全同形，
 * 虚拟化的部分与 MVirtualList 同形。行高默认按树的行高（32px）估。
 */
export interface VirtualTreeProps extends TreeProps {
  /** 每行固定高度 px；传了走定高模式，不量尺寸 */
  itemHeight?: number;
  /** 变高模式下没量过的行先按这个高度估，默认 32 */
  estimatedItemHeight?: number;
  /** 可视区上下各多渲染几行做缓冲，默认 5 */
  buffer?: number;
  /** 容器高度，数字按 px，字符串原样用；不传时为 300px，也可以用 CSS 覆盖 --m-virtual-tree-h */
  height?: number | string;
}

export interface VirtualTreeEmits extends TreeEmits {
  /** 滚动时，参数是 scrollTop */
  scroll: [top: number];
}

export interface VirtualTreeSlots {
  /** 自定义节点文字，作用域 { node, level } */
  default?: (scope: TreeLabelScope) => unknown;
}

export interface VirtualTreeExpose {
  /**
   * 滚到某个节点（按 key）。align 同 scrollTo，默认 "auto"：已经整个在可视区就不动，否则滚到最近的一端。
   * 只找当前展开序里的行：key 在收起的子树里（或不存在）时什么都不做，要先把祖先加进 expandedKeys
   */
  scrollToKey: (key: TreeKey, align?: VirtualListAlign) => void;
  /** 滚到展开序里的第 index 行 */
  scrollTo: (index: number, align?: VirtualListAlign) => void;
  /** 滚到指定 scrollTop */
  scrollToOffset: (top: number) => void;
  /** 当前 scrollTop */
  scrollTop: () => number;
}
