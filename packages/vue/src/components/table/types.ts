/** 单元格文字对齐 */
export type TableAlign = "left" | "center" | "right";

/** 行数据的兜底类型：MTableColumn 拿不到表格的泛型，插槽作用域里的行统一按它给 */
export type TableRow = Record<string, unknown>;

/** 行的唯一标识：字段名，或按行算一个 key 的函数 */
export type TableRowKey<T> = string | ((row: T, index: number) => string | number);

/** 用 columns 属性声明的一列 */
export interface TableColumnDef {
  /** 列对应的字段名，取值 row[param] */
  param: string;
  /** 列名；head-<param> 插槽优先 */
  label?: string;
  /** 列宽，数字按 px；不传按内容自动分配 */
  width?: string | number;
  /** 对齐，默认跟随表格的 align */
  align?: TableAlign;
}

/** 单元格插槽的作用域 */
export interface TableCellScope<T> {
  /** 当前行 */
  row: T;
  /** 当前行（与 row 相同，沿用旧版的名字） */
  data: T;
  /** 当前格取到的值 row[param] */
  value: unknown;
  /** 行下标 */
  index: number;
  /** 所在列 */
  column: TableColumnDef;
}

/** 表头插槽的作用域 */
export interface TableHeadScope {
  /** 所在列 */
  column: TableColumnDef;
}

export interface TableProps<T> {
  /** 表格数据，一项一行 */
  data?: T[];
  /** 列声明；不传则由默认插槽里的 MTableColumn 决定 */
  columns?: TableColumnDef[];
  /** 行的 key：字段名或函数，不传按下标 */
  rowKey?: TableRowKey<T>;
  /** 表格最大高度（CSS 长度）；超出后表体内滚动、表头固定 */
  height?: string;
  /** 单元格默认对齐，默认居中 */
  align?: TableAlign;
  /** 斑马纹：偶数行铺一层淡墨 */
  stripe?: boolean;
  /** 没有数据时的文字；empty 插槽优先 */
  emptyText?: string;
}

export interface TableEmits<T> {
  /** 点击某一行 */
  rowClick: [row: T, index: number, event: MouseEvent];
}

export interface TableSlots<T> {
  /** 放 MTableColumn，用组件的方式声明列 */
  default?: () => unknown;
  /** 没有数据时显示的内容 */
  empty?: () => unknown;
  /** 某一列的单元格：cell-<param>，用 columns 属性声明列时给自定义单元格 */
  [cell: `cell-${string}`]: ((scope: TableCellScope<T>) => unknown) | undefined;
  /** 某一列的表头：head-<param> */
  [head: `head-${string}`]: ((scope: TableHeadScope) => unknown) | undefined;
}

export interface TableColumnProps {
  /** 列对应的字段名，取值 row[param] */
  param: string;
  /** 列名；head 插槽优先 */
  label?: string;
  /** 列宽，数字按 px；不传按内容自动分配 */
  width?: string | number;
  /** 对齐，默认跟随表格的 align */
  align?: TableAlign;
}

export interface TableColumnSlots {
  /** 单元格内容，作用域 { row, data, value, index, column } */
  default?: (scope: TableCellScope<TableRow>) => unknown;
  /** 表头内容 */
  head?: (scope: TableHeadScope) => unknown;
}
