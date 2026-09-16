/**
 * 描述列表的无框架部分：把 items（或从子组件收集来的同一份配置）按列数排进网格、
 * 算出每格的 grid-row / grid-column，以及带格线时按宽度生成的那条墨线。
 *
 * 布局用 CSS grid 而不是 <table>：横排一格是「标签轨 + 值轨」两条轨，竖排一格一条轨；
 * 每个 <dt> / <dd> 的位置都在这里算好写成内联样式，不靠自动摆放 ——
 * 行线是和格子重叠的元素，自动摆放会互相避让。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { inkVarBindings, type InkVarBindings } from "../../ink/registry";
import type { DescriptionsItemConfig, DescriptionsLayout, DescriptionsProps } from "./types";

export type {
  DescriptionsItem,
  DescriptionsItemConfig,
  DescriptionsItemProps,
  DescriptionsItemScope,
  DescriptionsItemSlots,
  DescriptionsLayout,
  DescriptionsProps,
  DescriptionsSize,
  DescriptionsSlots,
} from "./types";

/** 列数默认值 */
const COLUMN = 3;
/** 墨线的种子 */
const SEED = 13;
/** 宽度按 32px 分桶，拉伸不超过一成，看不出变形 */
const WIDTH_BUCKET = 32;

export function descriptionsClasses(props: DescriptionsProps): string[] {
  const { layout = "horizontal", size = "md", bordered = false, colon = true } = props;
  return [
    "m-descriptions",
    `m-descriptions--${layout}`,
    `m-descriptions--${size}`,
    ...(bordered ? ["m-descriptions--bordered"] : []),
    ...(colon ? ["m-descriptions--colon"] : []),
  ];
}

/** 列数归一化：至少 1，小数截掉 */
export function descriptionsColumn(column: number | undefined): number {
  return Math.max(1, Math.floor(column ?? COLUMN));
}

/** 一格的跨度归一化：至少 1，最多整行 */
export function descriptionsSpan(span: number | undefined, column: number): number {
  return Math.min(column, Math.max(1, Math.floor(span ?? 1)));
}

/** 排好位置的一格，模板直接循环 */
export interface DescriptionsCell<Node = unknown> {
  readonly key: string | number;
  readonly item: DescriptionsItemConfig<Node>;
  /** 在 items 里的下标 */
  readonly index: number;
  /** 实际占的列数（截断、补满之后） */
  readonly span: number;
  /** 第几行，从 1 起 */
  readonly row: number;
  /** 是这一行最右边的一格：不画右边的列线 */
  readonly last: boolean;
  /** 在最后一行：不带格线时不留底边距 */
  readonly bottom: boolean;
  readonly labelClass: string;
  readonly valueClass: string;
  /** <dt> 的 grid-row / grid-column */
  readonly labelStyle: Record<string, string>;
  /** <dd> 的 grid-row / grid-column */
  readonly valueStyle: Record<string, string>;
}

/** 带格线时的一条横线：外框顶线 + 每行的底线 */
export interface DescriptionsLine {
  readonly key: string;
  /** 是外框顶线（贴行顶）；其余贴行底 */
  readonly top: boolean;
  readonly className: string;
  readonly style: Record<string, string>;
}

export interface DescriptionsGrid<Node = unknown> {
  readonly cells: DescriptionsCell<Node>[];
  /** 逻辑行数（一条数据占一行的那种行） */
  readonly rows: number;
  /** grid-template-columns */
  readonly template: string;
  /** 带格线时要画的横线；不带格线时是空数组 */
  readonly lines: DescriptionsLine[];
}

/** 横排一格两条轨（标签自适应、值分剩余），竖排一格一条轨 */
export function descriptionsGridTemplate(column: number, layout: DescriptionsLayout): string {
  return layout === "vertical"
    ? `repeat(${column}, minmax(0, 1fr))`
    : `repeat(${column}, auto minmax(0, 1fr))`;
}

/**
 * 把 items 排进网格。
 *
 * 换行和截断的规则：
 * 1. span 先截到列数以内；
 * 2. 本行剩下的列不够放时截到剩余列数（不换行留洞，格线才是完整的矩形）；
 * 3. 最后一条补满它所在的行；
 * 4. 放满一行就换到下一行。
 *
 * 位置全部写成内联样式：横排标签在第 2c+1 轨、值从第 2c+2 轨起跨 2s-1 轨；
 * 竖排标签在第 2r-1 行、值在第 2r 行，两者都从第 c+1 轨起跨 s 轨。
 */
export function descriptionsGrid<Node>(
  items: readonly DescriptionsItemConfig<Node>[],
  o: { column?: number; layout?: DescriptionsLayout; bordered?: boolean },
): DescriptionsGrid<Node> {
  const column = descriptionsColumn(o.column);
  const layout = o.layout ?? "horizontal";
  const vertical = layout === "vertical";
  const cells: DescriptionsCell<Node>[] = [];
  let row = 1;
  let used = 0;

  items.forEach((item, index) => {
    const rest = column - used;
    let span = Math.min(descriptionsSpan(item.span, column), rest);
    if (index === items.length - 1) span = rest;
    const start = used;
    used += span;
    const last = used === column;
    // 竖排：标签行、值行上下叠，同一组轨；横排：同一行，标签一条轨、值跨剩下的
    const track = `${start + 1} / span ${span}`;
    const labelStyle = vertical
      ? { gridRow: String(row * 2 - 1), gridColumn: track }
      : { gridRow: String(row), gridColumn: String(start * 2 + 1) };
    const valueStyle = vertical
      ? { gridRow: String(row * 2), gridColumn: track }
      : { gridRow: String(row), gridColumn: `${start * 2 + 2} / span ${span * 2 - 1}` };
    // bottom 要等排完才知道最后一行是哪行，下面统一补
    cells.push({
      key: item.key ?? index,
      item,
      index,
      span,
      row,
      last,
      bottom: false,
      labelClass: "",
      valueClass: "",
      labelStyle,
      valueStyle,
    });
    if (used >= column) {
      row += 1;
      used = 0;
    }
  });

  const rows = used === 0 ? row - 1 : row;
  const placed = cells.map((cell) => {
    const bottom = cell.row === rows;
    return {
      ...cell,
      bottom,
      labelClass: descriptionsCellClass("label", cell.last, bottom),
      valueClass: descriptionsCellClass("value", cell.last, bottom),
    };
  });
  const gridRows = vertical ? rows * 2 : rows;
  const lines: DescriptionsLine[] = [];
  if (o.bordered && rows > 0) {
    lines.push({
      key: "top",
      top: true,
      className: "m-descriptions__line m-descriptions__line--top",
      style: { gridRow: "1" },
    });
    for (let r = 1; r <= gridRows; r++) {
      lines.push({
        key: `r${r}`,
        top: false,
        className: "m-descriptions__line",
        style: { gridRow: String(r) },
      });
    }
  }
  return { cells: placed, rows, template: descriptionsGridTemplate(column, layout), lines };
}

/** 一格的 class：最右边的加 --last（不画右线），最后一行的加 --bottom（不带格线时不留底边距） */
export function descriptionsCellClass(part: "label" | "value", last: boolean, bottom: boolean) {
  const base = `m-descriptions__${part}`;
  return [base, ...(last ? [`${base}--last`] : []), ...(bottom ? [`${base}--bottom`] : [])].join(
    " ",
  );
}

/** 空值不显示 "undefined"，其余直出；null 是照顾接口里的空值，类型上不鼓励传 */
export function descriptionsValueText(value: string | number | null | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

export interface DescriptionsInk extends InkVarBindings {
  /** 量不到宽度（服务端、挂载瞬间）或不带格线时是空对象，CSS 里回落到通用线 */
  style: Record<string, string>;
}

/**
 * 格线用的横向墨线：按实际宽度生成、宽度分桶复用，口径和表格的行间线一样（1.5px 干笔）。
 *
 * 宽度是量出来的，服务端和水合首帧都是 0：那时什么都不给，渲染的是朴素版。
 * `mounted` 同时也是"能不能走素材登记"的闸门 —— 登记要写样式表，服务端写不了。
 */
export function descriptionsInk(o: {
  width: number;
  mounted: boolean;
  bordered: boolean;
}): DescriptionsInk {
  if (!o.bordered || o.width <= 0) return { attrs: {}, style: {} };
  const length = Math.max(WIDTH_BUCKET, Math.ceil(o.width / WIDTH_BUCKET) * WIDTH_BUCKET);
  // 1.5px 的笔宽算出来的画幅高正好是 9px，和 CSS 里的回落值一致：量到宽度后写入变量时高度不变
  const line = brushLineUrl({ seed: SEED, length, thickness: 1.5, roughness: 0.4 });
  const bindings = inkVarBindings({ "--m-descriptions-line": line.url }, o.mounted);
  return {
    attrs: bindings.attrs,
    style: { ...bindings.style, "--m-descriptions-ink-band": `${line.height}px` },
  };
}
