/**
 * 表格的无框架部分：列的归一化、取值与文本化、grid 轨道、class 派生，以及按表宽生成的三张墨图。
 *
 * 列序就是 `columns` 数组的顺序（子组件写法由壳在 render 期按书写顺序收集成同一个数组），
 * 这里一个 DOM 位置都不比。
 */
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
  readonly headClass: string;
  readonly cellClass: string;
  readonly column: TableColumnConfig<Row, Node>;
}

export function resolveTableColumns<Row, Node>(
  columns: readonly TableColumnConfig<Row, Node>[],
  align: TableAlign = "center",
): ResolvedTableColumn<Row, Node>[] {
  return columns.map((column, index) => {
    const resolved = column.align ?? align;
    return {
      // 同一个字段可以出现两次（比如两列都取 name 但渲染不同），所以 key 带上位置
      key: `${index}-${column.prop}`,
      prop: column.prop,
      label: column.label ?? "",
      width: column.width,
      align: resolved,
      headClass: `m-table__th m-table__th--${resolved}`,
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
