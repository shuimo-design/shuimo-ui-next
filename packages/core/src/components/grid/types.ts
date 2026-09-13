/** 响应式断点名：xs < 640 ≤ sm < 768 ≤ md < 1024 ≤ lg < 1280 ≤ xl */
export type GridBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

/** 列数：一个数字全局生效，或按断点给（缺的断点沿用比它小的那一档） */
export type GridCols = number | Partial<Record<GridBreakpoint, number>>;

/** 一条边的倾斜角：数字按度，字符串可带 deg 后缀 */
export type CellAngle = number | string;

export interface CellProps {
  /** 宽 px；不传则在栅格里均分剩余宽度 */
  w?: number;
  /** 高 px；不传则由内容撑开 */
  h?: number;
  /** 画边框（默认皮肤是细线，水墨模式换成笔触） */
  border?: boolean;
  /** 四条边的倾斜角简写，同 CSS 的 1–4 值写法：上 右 下 左；一个数字则四边同角 */
  points?: CellAngle;
  /** 上边倾斜角（度），正值右端下沉 */
  a?: CellAngle;
  /** 右边倾斜角（度），正值成 "/"（下端左移） */
  b?: CellAngle;
  /** 下边倾斜角（度），正值左端上抬 */
  c?: CellAngle;
  /** 左边倾斜角（度），正值成 "/"（上端右移） */
  d?: CellAngle;
  /** 在 cols 模式的栅格里横跨几列，默认 1 */
  span?: number;
  /** 在 cols 模式的栅格里从行首空出几列再放（即从第 offset+1 列开始） */
  offset?: number;
}

/** MCell 实际收到的属性：比公开的 CellProps 多一项由 MGrid 填的内部值 */
export interface CellComponentProps extends CellProps {
  /**
   * 内部用，MGrid 填：左边的斜角是栅格的 gapRotate 分给它的。
   * 格子据此往左压 h·tan|θ|，才和前一个格子的右斜边平行等距。
   */
  shiftAngle?: number;
}

/**
 * 用 `cells` 数组声明的一个格子。
 *
 * 为什么是数组而不是靠 MCell 子组件登记：子组件登记要等挂载后才知道自己排第几
 * （旧版靠比较 DOM 位置），而 gapRotate 的第 i 道斜缝正好要用这个下标。
 * React 的 effect 顺序在 Fragment / Suspense / 并发切片下不保证跟 DOM 一致，
 * 服务端更是没有 DOM。数组下标服务端就算得出来，两边一致。
 */
export interface GridCellConfig<Node = unknown> extends CellProps {
  /** 列表 key；不给就用下标 */
  key?: string | number;
  /** 格子内容 */
  content?: Node;
}

export interface GridProps {
  /** 每个格子的配置，顺序就是排列顺序；不传则从子组件 MCell 上收集 */
  cells?: readonly GridCellConfig[];
  /** 格子的默认宽 px；格子自己传了 w 以自己的为准 */
  w?: number;
  /** 格子的默认高 px；格子自己传了 h 以自己的为准 */
  h?: number;
  /** 格子之间的间距，数字按 px，字符串原样用 */
  gap?: number | string;
  /** 横向排列时格子之间的间距，优先于 gap */
  colGap?: number | string;
  /** 纵向排列时格子之间的间距，优先于 gap */
  rowGap?: number | string;
  /** 横向排列时每道分隔的倾斜角度（度），第 i 项作用在第 i 和 i+1 个格子之间；正值为 "/"，负值为 "\" */
  gapRotate?: number[];
  /** 排列方向，默认 row */
  direction?: "row" | "column";
  /** 列数；传了就切成等宽的网格，格子用 span / offset 占位，gapRotate 不再生效 */
  cols?: GridCols;
}

export interface GridSlots {
  /** 放 MCell（语法糖；传了 cells 就不看这里） */
  default?: () => unknown;
}

export interface CellSlots {
  /** 格子里的内容 */
  default?: () => unknown;
}
