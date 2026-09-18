/** 单元格文字对齐 */
export type TableAlign = "left" | "center" | "right";

/** 行数据的兜底类型：没给泛型时行就按它算 */
export type TableRow = Record<string, unknown>;

/** 行的唯一标识：字段名，或按行算一个 key 的函数 */
export type TableRowKey<Row> = string | ((row: Row, index: number) => string | number);

/** 排序方向 */
export type TableSortOrder = "ascending" | "descending";

/** 当前的排序：按哪一列、什么方向；null 是不排 */
export interface TableSort {
  /** 列的 prop */
  prop: string;
  /** 方向 */
  order: TableSortOrder;
}

/** 列的比较函数：返回负数 a 在前、正数 b 在前；组件按 ascending 用它、descending 取反 */
export type TableSorter<Row> = (a: Row, b: Row) => number;

/** 单元格的作用域，交给列上的 render */
export interface TableCellScope<Row = TableRow> {
  /** 当前行 */
  row: Row;
  /** 当前行（与 row 相同，沿用旧版的名字） */
  data: Row;
  /** 当前格取到的值 row[prop] */
  value: unknown;
  /** 行下标 */
  index: number;
  /** 所在列 */
  column: TableColumnConfig<Row>;
}

/** 表头的作用域，交给列上的 renderHead */
export interface TableHeadScope<Row = TableRow> {
  /** 所在列 */
  column: TableColumnConfig<Row>;
}

/**
 * 一列的配置。
 *
 * 为什么是数组而不是靠 MTableColumn 子组件登记：子组件登记要等挂载后才知道列序
 * （旧版靠比较隐藏占位元素的 DOM 位置排序），React 的 effect 顺序在 Fragment / Suspense /
 * 并发切片下不保证跟 DOM 一致，服务端更是没有 DOM。数组顺序服务端就算得出来，两边一致。
 *
 * 作用域插槽在这里统一成 **render 属性**：Vue 的 `#default="{ row, column }"` 和 React 的
 * render prop 是同一个函数签名，`Node` 由各框架收窄成自己的可渲染类型。
 */
export interface TableColumnConfig<Row = TableRow, Node = unknown> {
  /** 列对应的字段名，取值 row[prop] */
  prop: string;
  /** 列名；renderHead 优先 */
  label?: string;
  /** 列宽，数字按 px；不传按内容自动分配 */
  width?: string | number;
  /** 对齐，默认跟随表格的 align */
  align?: TableAlign;
  /** 自定义单元格；不给就直出 row[prop] */
  render?: (scope: TableCellScope<Row>) => Node;
  /** 自定义表头；不给就直出 label */
  renderHead?: (scope: TableHeadScope<Row>) => Node;
  /** 可排序：true 按 row[prop] 用默认比较（数字按数值、字符串 localeCompare、空值排最后），也可以给比较函数 */
  sortable?: boolean | TableSorter<Row>;
}

export interface TableProps<Row = TableRow> {
  /** 表格数据，一项一行 */
  data?: readonly Row[];
  /** 列声明，顺序就是列序；不传则从子组件 MTableColumn 上收集 */
  columns?: readonly TableColumnConfig<Row>[];
  /** 行的 key：字段名或函数，不传按下标 */
  rowKey?: TableRowKey<Row>;
  /** 表格最大高度（CSS 长度）；超出后表体内滚动、表头固定 */
  height?: string;
  /** 单元格默认对齐，默认居中 */
  align?: TableAlign;
  /** 斑马纹：偶数行铺一层淡墨 */
  stripe?: boolean;
  /** 没有数据时的文字；empty 插槽优先 */
  emptyText?: string;
  /** 初始排序；不绑 sort 时作为非受控初值 */
  defaultSort?: TableSort;
  /** 服务端排序：不在本地排，只发 sortChange */
  sortRemote?: boolean;
}

export interface TableEmits<Row = TableRow> {
  /** 点击某一行 */
  rowClick: [row: Row, index: number, event: MouseEvent];
  /** 排序变化；null 是取消排序 */
  sortChange: [sort: TableSort | null];
}

export interface TableSlots {
  /** 放 MTableColumn，用组件的方式声明列（语法糖；传了 columns 就不看这里） */
  default?: () => unknown;
  /** 没有数据时显示的内容 */
  empty?: () => unknown;
}

export interface TableColumnProps {
  /** 列对应的字段名，取值 row[prop] */
  prop: string;
  /** 列名；head 插槽优先 */
  label?: string;
  /** 列宽，数字按 px；不传按内容自动分配 */
  width?: string | number;
  /** 对齐，默认跟随表格的 align */
  align?: TableAlign;
  /** 可排序：true 按 row[prop] 用默认比较，也可以给比较函数 */
  sortable?: boolean | TableSorter<TableRow>;
}

export interface TableColumnSlots {
  /** 单元格内容，作用域 { row, data, value, index, column } */
  default?: (scope: TableCellScope) => unknown;
  /** 表头内容，作用域 { column } */
  head?: (scope: TableHeadScope) => unknown;
}
