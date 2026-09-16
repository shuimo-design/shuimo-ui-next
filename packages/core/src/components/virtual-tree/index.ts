/**
 * 虚拟滚动树的无框架部分。
 *
 * 树的逻辑（建树、展开集合、勾选联动、键盘动作）一行不重写，全用 tree 模块的；
 * 这里只补虚拟滚动要的两样：
 * - `flattenVirtualTree`：把"当前看得见的节点"摊成一个平铺数组，行号即下标。
 *   这个数组就是 createVirtualList 控制器的"项"——它本来就按 unknown[] 工作，
 *   窗口计算、量行高、滚动补偿全部白拿。
 * - 根上的变量派生，两个壳调同一份，输出的字符串才一模一样。行的类名用 tree 的 treeRowClasses，
 *   皮肤和 MTree 共用 internal/tree-row.css。
 *
 * 行元素表是 tree 的 `createTreeRows` 的加强版 `createVirtualTreeFocus`：`focus()` 回一个布尔，
 * 目标行滚出渲染窗口时元素已经下线，拿到 false 的调用方要先 scrollTo、等行挂上来再补聚焦；
 * 反过来焦点行自己被滚出窗口时它会把焦点接到容器上，键盘不至于失灵（两个壳各写这几行接线）。
 */
import { isClient } from "../../runtime/dom";
import type { TreeRows } from "../tree";
import type { TreeNode, TreeKey } from "../tree/types";

export type {
  VirtualTreeEmits,
  VirtualTreeExpose,
  VirtualTreeProps,
  VirtualTreeSlots,
} from "./types";

/** 摊平后的一行：节点加上无障碍树要的位次信息 */
export interface VirtualTreeRow {
  node: TreeNode;
  /** aria-posinset：在兄弟里的位次，从 1 数 */
  posInSet: number;
  /** aria-setsize：父节点（顶层就是根列表）一共有几个子节点 */
  setSize: number;
}

/**
 * 当前看得见的节点，按屏幕顺序摊平。遍历的是数据不是 DOM，服务端也算得出来；
 * 和 tree 的 `visibleTreeNodes` 同一趟遍历，只是顺手把位次也记下来。
 */
export function flattenVirtualTree(
  nodes: readonly TreeNode[],
  expanded: ReadonlySet<TreeKey>,
): VirtualTreeRow[] {
  const out: VirtualTreeRow[] = [];
  const walk = (list: readonly TreeNode[]): void => {
    for (let i = 0; i < list.length; i++) {
      const node = list[i]!;
      out.push({ node, posInSet: i + 1, setSize: list.length });
      if (node.children.length > 0 && expanded.has(node.key)) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/**
 * key → 在摊平数组里的下标。展开序变一次算一次（和摊平本身同一个量级），
 * 之后按键、scrollToKey 都是查表，不用每次都从头找
 */
export function virtualTreeRowIndexes(rows: readonly VirtualTreeRow[]): Map<TreeKey, number> {
  const map = new Map<TreeKey, number>();
  for (let i = 0; i < rows.length; i++) map.set(rows[i]!.node.key, i);
  return map;
}

/* ---------- 焦点 ---------- */

export interface VirtualTreeFocus extends TreeRows {
  /** 容器元素：焦点行被卸掉时焦点先落到它身上 */
  setHost(el: HTMLElement | null): void;
  /** 某一行拿到了焦点（壳在行的 focusin 上调） */
  setActive(key: TreeKey): void;
  /** 最近一次拿到焦点的行；容器接住焦点之后，按键就从这一行接着走 */
  activeKey(): TreeKey | null;
}

/**
 * 虚拟树的行元素表。和 `createTreeRows` 的差别只有一处：焦点行被卸掉（用鼠标把它滚出了渲染窗口）
 * 时焦点本来会掉到 body，从此方向键失灵；这里在它下线前把焦点接到容器上，容器再把按键
 * 交回最近一次聚焦的那一行（见 virtualTreeResumesFocus）。
 *
 * 只在"当前焦点确实在这一行里"时才接：用户先点了页面别处再来滚树，焦点本来就在外面，不能抢。
 * 壳的 ref / 指令在 DOM 真正移除之前就会拿 null 来调一次（Vue 的 unmount 和 React 的 ref 清理都是），
 * 所以这时候 contains 还查得到。
 */
export function createVirtualTreeFocus(): VirtualTreeFocus {
  const rows = new Map<TreeKey, HTMLElement>();
  let host: HTMLElement | null = null;
  let active: TreeKey | null = null;
  return {
    set(key, el) {
      if (el) {
        rows.set(key, el);
        return;
      }
      const prev = rows.get(key);
      rows.delete(key);
      if (!prev || active !== key || !host || !isClient()) return;
      const current = document.activeElement;
      if (current && prev.contains(current)) host.focus({ preventScroll: true });
    },
    focus(key) {
      const el = rows.get(key);
      if (!el) return false;
      el.focus();
      return true;
    },
    setHost(el) {
      host = el;
    },
    setActive(key) {
      active = key;
    },
    activeKey: () => active,
  };
}

const RESUME_KEYS = new Set(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"]);

/**
 * 焦点落在容器上（焦点行已经被滚出窗口）时，哪些键要把焦点送回最近一次聚焦的那一行。
 * 只送回、不执行：用户看不见那一行，直接在它身上展开 / 选中都说不通；焦点回去之后再按一次就是正常的行为
 */
export function virtualTreeResumesFocus(key: string): boolean {
  return RESUME_KEYS.has(key);
}

export function virtualTreeClasses(): string[] {
  return ["m-virtual-tree"];
}

/** 容器高度写进根变量；不传时不写，走 CSS 里的默认值 */
export function virtualTreeRootStyle(height: number | string | undefined): Record<string, string> {
  return height === undefined
    ? {}
    : { "--m-virtual-tree-h": typeof height === "number" ? `${height}px` : height };
}
