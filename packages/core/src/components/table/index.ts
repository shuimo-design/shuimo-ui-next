/**
 * 表格的无框架部分：列的归一化、取值与文本化、grid 轨道、class 派生、排序的纯函数，
 * 以及按表宽生成的三张墨图。
 *
 * 列序就是 `columns` 数组的顺序（子组件写法由壳在 render 期按书写顺序收集成同一个数组），
 * 这里一个 DOM 位置都不比。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { brushLineUrl } from "../../ink/assets/line";
import { inkShapeUrl } from "../../ink/assets/shape";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import type {
  TableAlign,
  TableCellScope,
  TableColumnConfig,
  TableHeadScope,
  TableProps,
  TableRow,
  TableRowKey,
  TableSort,
  TableSortOrder,
  TableSorter,
} from "./types";

export type {
  TableAlign,
  TableCellScope,
  TableColumnConfig,
  TableColumnProps,
  TableColumnSlots,
  TableEmits,
  TableHeadScope,
  TableProps,
  TableRow,
  TableRowKey,
  TableSlots,
  TableSort,
  TableSortOrder,
  TableSorter,
} from "./types";

/** 三张墨图共用的种子；细线在它上面 +1，免得两笔的飞白位置一样 */
const SEED = 11;
/** 表宽按 32px 分桶，拉伸不超过一成，看不出变形 */
const WIDTH_BUCKET = 32;

/** 根元素的 class；两个壳必须产出一模一样的一串 */
export function tableClasses(props: Pick<TableProps<never>, "stripe" | "height">): string[] {
  return [
    "m-table",
    ...(props.stripe ? ["m-table--stripe"] : []),
    ...(props.height ? ["m-table--scroll"] : []),
  ];
}

/** 模板直接拿来循环的一列：对齐和 class 都算好了。Node 原样带着，不然壳里 render 的返回值会退化成 unknown */
export interface ResolvedTableColumn<Row = TableRow, Node = unknown> {
  readonly key: string;
  readonly prop: string;
  /** 表头文字；没给 label 就是空串（和旧版一致） */
  readonly label: string;
  /** 列宽原样带过来，grid 轨道要用 */
  readonly width: string | number | undefined;
  readonly align: TableAlign;
  /** 这一列能不能排序（true 或给了比较函数都算） */
  readonly sortable: boolean;
  readonly headClass: string;
  readonly cellClass: string;
  readonly column: TableColumnConfig<Row, Node>;
}

/** sortable 写成 true 或比较函数都算可排；子组件写法里裸写 `sortable` 收到的是空串，也算 true */
export function tableColumnSortable(value: unknown): boolean {
  return value === true || value === "" || typeof value === "function";
}

export function resolveTableColumns<Row, Node>(
  columns: readonly TableColumnConfig<Row, Node>[],
  align: TableAlign = "center",
): ResolvedTableColumn<Row, Node>[] {
  return columns.map((column, index) => {
    const resolved = column.align ?? align;
    const sortable = tableColumnSortable(column.sortable);
    return {
      // 同一个字段可以出现两次（比如两列都取 name 但渲染不同），所以 key 带上位置
      key: `${index}-${column.prop}`,
      prop: column.prop,
      label: column.label ?? "",
      width: column.width,
      align: resolved,
      sortable,
      headClass: `m-table__th m-table__th--${resolved}${sortable ? " m-table__th--sortable" : ""}`,
      cellClass: `m-table__td m-table__td--${resolved}`,
      column,
    };
  });
}

/** 列宽 → grid 轨道：给了宽度就定死，没给的按内容分剩余空间 */
export function tableGridTemplate(
  columns: readonly { readonly width?: string | number }[],
): string {
  return columns
    .map(({ width }) => {
      if (width === undefined || width === "") return "auto";
      return typeof width === "number" ? `${width}px` : width;
    })
    .join(" ");
}

/* ---------------- 排序 ---------------- */

/**
 * 默认比较：空值（null / undefined）排最后，两个数按数值，其余转成字符串按 localeCompare。
 * 数字和字符串混着时也走字符串比较，不会抛。
 */
export function compareTableValues(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined;
  const bEmpty = b === null || b === undefined;
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/** 当前排序落在这一列上时的方向，否则 null */
export function tableSortOrder(
  sort: TableSort | null | undefined,
  prop: string,
): TableSortOrder | null {
  return sort && sort.prop === prop ? sort.order : null;
}

/** 表头点一下之后的排序：无 → 升序 → 降序 → 无；点到别的列从升序重新开始 */
export function nextTableSort(sort: TableSort | null | undefined, prop: string): TableSort | null {
  const order = tableSortOrder(sort, prop);
  if (order === null) return { prop, order: "ascending" };
  if (order === "ascending") return { prop, order: "descending" };
  return null;
}

/** 可排序列的 aria-sort：没排到自己时报 none，读屏才知道这一列能排 */
export function tableSortAria(
  sort: TableSort | null | undefined,
  prop: string,
): TableSortOrder | "none" {
  return tableSortOrder(sort, prop) ?? "none";
}

/** 表头排序按钮的 class：当前方向挂在按钮上，CSS 据此点亮对应的那枚三角 */
export function tableSortClasses(order: TableSortOrder | null): string[] {
  return ["m-table__sort", ...(order ? [`m-table__sort--${order}`] : [])];
}

/** 排序后的一行：index 是它在 data 里的原下标，排序不改它，按下标算的 rowKey 排序后还是稳的 */
export interface TableSortedRow<Row> {
  readonly row: Row;
  readonly index: number;
}

/**
 * 按当前排序把行排好。稳定排序：比出来相等的行保持 data 里的先后。
 * sort 为 null（不排、或 sortRemote 交给服务端）、或者对应的列不存在 / 不可排时原序返回。
 */
export function sortTableRows<Row, Node>(
  rows: readonly Row[],
  sort: TableSort | null | undefined,
  columns: readonly TableColumnConfig<Row, Node>[],
): TableSortedRow<Row>[] {
  const list = rows.map((row, index) => ({ row, index }));
  if (!sort) return list;
  const column = columns.find((c) => c.prop === sort.prop && tableColumnSortable(c.sortable));
  if (!column) return list;
  const sorter: TableSorter<Row> =
    typeof column.sortable === "function"
      ? column.sortable
      : (a, b) => compareTableValues(tableCellValue(a, sort.prop), tableCellValue(b, sort.prop));
  const sign = sort.order === "ascending" ? 1 : -1;
  return list.sort((a, b) => sign * sorter(a.row, b.row));
}

/* ---------------- 墨迹 ---------------- */

/**
 * 排序指示器里点亮的那枚三角在水墨层换成的墨点。不随 props 变，整个模块只生成一次，
 * 每个可排序表头内联这一份变量（几十字节，不值得走素材登记）。
 */
const SORT_INK_STYLE: Record<string, string> = {
  "--m-table-sort-dot": `url("${inkBlobUrl({ seed: 11, size: 24, radius: 0.36, raggedness: 0.18 })}")`,
};

export function tableSortInk(): Record<string, string> {
  return SORT_INK_STYLE;
}

export function tableCellValue<Row>(row: Row, prop: string): unknown {
  return (row as TableRow)[prop];
}

/** 空值不显示 "undefined"，对象转 JSON，其余直出 */
export function tableCellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export function tableCellScope<Row>(
  row: Row,
  index: number,
  column: TableColumnConfig<Row>,
): TableCellScope<Row> {
  return { row, data: row, value: tableCellValue(row, column.prop), index, column };
}

export function tableHeadScope<Row>(column: TableColumnConfig<Row>): TableHeadScope<Row> {
  return { column };
}

export function tableRowId<Row>(
  row: Row,
  index: number,
  rowKey: TableRowKey<Row> | undefined,
): string | number {
  if (typeof rowKey === "function") return rowKey(row, index);
  if (rowKey) {
    const value = tableCellValue(row, rowKey);
    if (typeof value === "string" || typeof value === "number") return value;
  }
  return index;
}

export interface TableInk extends InkVarBindings {
  /** 量不到宽度（服务端、挂载瞬间）时是 undefined，CSS 里回落到通用线 */
  style: Record<string, string>;
}

/**
 * 三张墨图（粗线、细线、淡墨块）按表格实际宽度生成，宽度分桶复用。
 *
 * 宽度是量出来的，服务端和水合首帧都是 0：那时什么都不给，渲染的是朴素版。
 * `mounted` 同时也是"能不能走素材登记"的闸门 —— 登记要写样式表，服务端写不了。
 */
export function tableInk(o: { width: number; mounted: boolean }): TableInk {
  if (o.width <= 0) return { attrs: {}, style: {} };
  const length = Math.max(WIDTH_BUCKET, Math.ceil(o.width / WIDTH_BUCKET) * WIDTH_BUCKET);
  // 两种笔宽算出来的画幅高正好是 18px / 9px，和 CSS 里的回落值一致：
  // 量到宽度后写入变量时表格高度不变，不会触发尺寸监听的循环告警
  const thick = brushLineUrl({ seed: SEED, length, thickness: 3, flyingWhite: 0.2 });
  const thin = brushLineUrl({ seed: SEED + 1, length, thickness: 1.5, roughness: 0.4 });
  const wash = inkShapeUrl(length, 40, { seed: SEED, raggedness: 1, corner: 0.08 });
  const bindings = inkVarBindings(
    {
      "--m-table-line-thick": thick.url,
      "--m-table-line-thin": thin.url,
      "--m-table-wash": wash.url,
    },
    o.mounted,
  );
  return {
    attrs: bindings.attrs,
    style: {
      ...bindings.style,
      "--m-table-ink-thick-band": `${thick.height}px`,
      "--m-table-ink-thin-band": `${thin.height}px`,
      "--m-table-wash-pad": `${wash.padding}px`,
    },
  };
}
