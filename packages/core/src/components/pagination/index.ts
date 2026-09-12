/**
 * 分页的无框架部分。这个组件没有任何时序，全是纯派生：
 * 总页数、页码折叠、layout 串解析、越界收敛、每页条数选项、以及全部文案与 aria 名字。
 *
 * 文案和 aria 也放这里，不是洁癖：测试和读屏都按名字找元素，
 * 两个壳各写一份「上一页」迟早会飘，用例就只能各写各的。
 */
import { inkMarkUrl } from "../../ink/assets/mark";
import { inkShapeUrl } from "../../ink/assets/shape";
import type { Pager } from "./pager";
import type { PaginationLayoutKey } from "./types";

export { buildPagers, type BuildPagersOptions, type Pager } from "./pager";
export type {
  PaginationEmits,
  PaginationLayoutKey,
  PaginationProps,
  PaginationSlots,
} from "./types";

/** layout 串里认得的区域名，顺序即渲染顺序 */
const LAYOUT_KEYS: readonly PaginationLayoutKey[] = [
  "prev",
  "pager",
  "next",
  "jumper",
  "sizes",
  "total",
];

/* ── 文案与无障碍名字 ─────────────────────────────────────────── */

export const PAGINATION_LABEL = "分页";
export const PAGINATION_PREV_LABEL = "上一页";
export const PAGINATION_NEXT_LABEL = "下一页";
export const PAGINATION_JUMPER_LABEL = "跳转页码";
export const PAGINATION_SIZES_LABEL = "每页条数";
/** 跳页输入框两侧的字：前往 [ ] 页 */
export const PAGINATION_JUMPER_PREFIX = "前往";
export const PAGINATION_JUMPER_SUFFIX = "页";
/** 折叠按钮上的三点，用的是间隔号不是省略号，和旧版一致 */
export const PAGINATION_FOLD_TEXT = "···";

export function paginationTotalText(total: number): string {
  return `共 ${total} 条`;
}

export function paginationPageLabel(page: number): string {
  return `第 ${page} 页`;
}

/** 折叠按钮的名字要说清楚点下去走多远，只念「省略号」对读屏没用 */
export function paginationFoldLabel(pager: Extract<Pager, { type: "fold" }>, current: number) {
  return pager.direction === "prev"
    ? `向前 ${current - pager.page} 页`
    : `向后 ${pager.page - current} 页`;
}

export function paginationSizeLabel(size: number): string {
  return `${size} 条/页`;
}

/* ── 纯派生 ──────────────────────────────────────────────────── */

/** 总页数最少是 1：一条数据都没有时也要有个「第 1 页」，不然翻页按钮全是死的 */
export function paginationPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
}

/** layout 串 → 区域列表；不认得的名字直接丢掉 */
export function paginationSections(layout: string): PaginationLayoutKey[] {
  return layout
    .split(",")
    .map((key) => key.trim())
    .filter((key): key is PaginationLayoutKey => LAYOUT_KEYS.includes(key as PaginationLayoutKey));
}

export interface PaginationSizeOption {
  label: string;
  value: number;
}

export function paginationSizeOptions(pageSizes: number[]): PaginationSizeOption[] {
  return pageSizes.map((size) => ({ label: paginationSizeLabel(size), value: size }));
}

export function paginationClasses(disabled: boolean): string[] {
  return ["m-pagination", ...(disabled ? ["m-pagination--disabled"] : [])];
}

export function paginationVisible(hideOnSinglePage: boolean, pageCount: number): boolean {
  return !(hideOnSinglePage && pageCount <= 1);
}

/** 跳到第几页：取整、收进 [1, pageCount] */
export function clampPage(page: number, pageCount: number): number {
  return Math.min(Math.max(Math.trunc(page), 1), pageCount);
}

/** 跳页输入框里敲的东西；不是数字就返回 undefined，调用方原地不动 */
export function parseJumpPage(text: string): number | undefined {
  const page = Number.parseInt(text, 10);
  return Number.isNaN(page) ? undefined : page;
}

/**
 * 水墨皮肤：当前页衬一枚毛边朱砂印，翻页箭头换成细笔一撇；
 * 箭头笔宽比通用记号细，贴近旧版位图。整个模块只生成一次。
 */
const SEAL = inkShapeUrl(28, 28, { seed: 7, raggedness: 0.6, corner: 0.14 });
const CHEVRON_LEFT = inkMarkUrl("chevronLeft", { seed: 3, strokeWidth: 1.8 });
const CHEVRON_RIGHT = inkMarkUrl("chevronRight", { seed: 3, strokeWidth: 1.8 });

export function paginationInkStyle(): Record<string, string> {
  return {
    "--m-pagination-seal": `url("${SEAL.url}")`,
    "--m-pagination-seal-pad": `${SEAL.padding}px`,
    "--m-pagination-chevron-left": `url("${CHEVRON_LEFT}")`,
    "--m-pagination-chevron-right": `url("${CHEVRON_RIGHT}")`,
  };
}
