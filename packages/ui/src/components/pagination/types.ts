/** layout 里可用的区域名 */
export type PaginationLayoutKey = "prev" | "pager" | "next" | "jumper" | "sizes" | "total";

export interface PaginationProps {
  /** 数据总条数，默认 0 */
  total?: number;
  /** 每页条数的候选，给 sizes 区域用，默认 [10, 20, 30, 40, 50, 100] */
  pageSizes?: number[];
  /** 区域排列，逗号分隔：prev / pager / next / jumper / sizes / total；默认 "prev, pager, next, jumper, total" */
  layout?: string;
  /** 折叠后最多显示的页码个数（首末页算在内，偶数会补成奇数），默认 5 */
  foldedMaxPageBtn?: number;
  /** 总页数不超过它就全部平铺不折叠，默认 10 */
  maxPageBtn?: number;
  /** 折叠时始终显示首页和末页，默认 true */
  showEdgePageNum?: boolean;
  /** 只有一页时整个不渲染 */
  hideOnSinglePage?: boolean;
  /** 禁用 */
  disabled?: boolean;
}

export interface PaginationEmits {
  /** 当前页变化 */
  change: [page: number];
  /** 每页条数变化 */
  sizeChange: [size: number];
}

export interface PaginationSlots {
  /** 替代「共 N 条」 */
  total?: (scope: { total: number; pageCount: number }) => unknown;
}
