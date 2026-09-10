/** 页码折叠算法：纯函数，和渲染分开便于测试 */
export type Pager =
  | { type: "page"; page: number }
  /** 省略号：点它跳到 page */
  | { type: "fold"; page: number; direction: "prev" | "next" };

export interface BuildPagersOptions {
  pageCount: number;
  current: number;
  /** 折叠后最多显示的页码个数（含首末页） */
  foldedMax: number;
  /** 不超过这个页数就不折叠 */
  maxPageBtn: number;
  showEdge: boolean;
}

function range(start: number, end: number): Pager[] {
  const list: Pager[] = [];
  for (let page = start; page <= end; page++) list.push({ type: "page", page });
  return list;
}

/** 页码窗口要以当前页为中心对称，所以个数补成奇数 */
function odd(n: number): number {
  return n % 2 === 0 ? n + 1 : n;
}

export function buildPagers(options: BuildPagersOptions): Pager[] {
  const { pageCount, current, showEdge } = options;
  if (pageCount <= 1) return range(1, Math.max(pageCount, 1));
  const window = odd(Math.max(options.foldedMax, 3));
  if (pageCount <= Math.max(options.maxPageBtn, window)) return range(1, pageCount);

  // 首末页各占一个位置，中间那段才是围着当前页滑动的窗口
  const inner = showEdge ? Math.max(window - 2, 1) : window;
  const lo = showEdge ? 2 : 1;
  const hi = showEdge ? pageCount - 1 : pageCount;
  const half = Math.floor(inner / 2);
  const start = Math.min(Math.max(current - half, lo), hi - inner + 1);
  const end = start + inner - 1;

  const list: Pager[] = [];
  if (showEdge) list.push({ type: "page", page: 1 });
  if (start > lo) {
    // 只藏一页时直接把它露出来，省略号占的位置还不如页码本身
    if (start === lo + 1) list.push({ type: "page", page: lo });
    else list.push({ type: "fold", page: Math.max(1, current - inner), direction: "prev" });
  }
  list.push(...range(start, end));
  if (end < hi) {
    if (end === hi - 1) list.push({ type: "page", page: hi });
    else list.push({ type: "fold", page: Math.min(pageCount, current + inner), direction: "next" });
  }
  if (showEdge) list.push({ type: "page", page: pageCount });
  return list;
}
