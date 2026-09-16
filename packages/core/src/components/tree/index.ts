/**
 * 树的无框架部分：建树、展开集合运算、勾选联动、可见节点遍历、键盘动作、class 派生。
 *
 * 原来这些全写在 MTree.vue 的 setup 里（279 行）。它本来就不靠 provide 往上冒泡：
 * 根组件一次性 build() 出带 parent / level 的完整树，勾选态是从 checkedKeys 纯派生的，
 * 可见节点也是遍历数据而不是 DOM —— 所以整段几乎原样搬过来，只把 Vue 的 computed 拆成纯函数，
 * 由两个壳各自在渲染期调（Vue 的 computed / React 的 useMemo）。
 *
 * 唯一碰 DOM 的是 createTreeRows()：方向键要把焦点挪到另一行上，得拿着行元素。
 * 它没有驱动渲染的状态，所以不写成控制器，就是一张 key → 元素的表。
 */
import { inkTipUrl } from "../../ink/assets/tip";
import { TREE_UNCHECKED, type TreeCheckState } from "../../context/tree";
import type { TreeFieldNames, TreeKey, TreeNode, TreeNodeData } from "./types";

export type {
  TreeEmits,
  TreeFieldNames,
  TreeKey,
  TreeLabelScope,
  TreeNode,
  TreeNodeData,
  TreeProps,
  TreeSlots,
} from "./types";

/** 展开箭头的无障碍文案，两个壳必须一致 */
export const TREE_EXPAND_LABEL = "展开";
export const TREE_COLLAPSE_LABEL = "收起";

/* ---------- 数据整理 ---------- */

export interface TreeFields {
  key: string;
  label: string;
  children: string;
  disabled: string;
  expand: string;
}

/** 字段名映射的默认值 */
export function resolveTreeFields(fieldNames: TreeFieldNames | undefined): TreeFields {
  return {
    key: fieldNames?.key ?? "key",
    label: fieldNames?.label ?? "label",
    children: fieldNames?.children ?? "children",
    disabled: fieldNames?.disabled ?? "disabled",
    expand: fieldNames?.expand ?? "expand",
  };
}

function isDataList(value: unknown): value is TreeNodeData[] {
  return Array.isArray(value);
}

/** 把原始数据整理成带 parent / level 的节点树；没 key 的节点按路径补一个 */
export function buildTreeNodes(
  items: readonly TreeNodeData[],
  fields: TreeFields,
  level = 0,
  parent: TreeNode | undefined = undefined,
  path = "",
): TreeNode[] {
  return items.map((raw, index) => {
    const rawKey = raw[fields.key];
    const key =
      typeof rawKey === "string" || typeof rawKey === "number" ? rawKey : `${path}${index}`;
    const node: TreeNode = {
      key,
      label: String(raw[fields.label] ?? ""),
      disabled: Boolean(raw[fields.disabled]),
      level,
      children: [],
      parent,
      data: raw,
    };
    const children = raw[fields.children];
    node.children = isDataList(children)
      ? buildTreeNodes(children, fields, level + 1, node, `${key}-`)
      : [];
    return node;
  });
}

/** 初始要展开的父节点：defaultExpandAll 全收，否则只收数据里标了 expand 的 */
export function collectInitialExpanded(
  nodes: readonly TreeNode[],
  fields: TreeFields,
  defaultExpandAll: boolean,
  out: TreeKey[] = [],
): TreeKey[] {
  for (const node of nodes) {
    if (node.children.length > 0) {
      if (defaultExpandAll || node.data[fields.expand] === true) out.push(node.key);
      collectInitialExpanded(node.children, fields, defaultExpandAll, out);
    }
  }
  return out;
}

/* ---------- 展开集合运算 ---------- */

/**
 * 把 extra 并进 keys 去重。**一个都没新增就原样返回 keys**（引用相同）——
 * 壳靠这个判断要不要写回双向绑定，否则 React 那边会在 effect 里把自己抖成死循环。
 */
export function mergeTreeKeys(keys: readonly TreeKey[], extra: readonly TreeKey[]): TreeKey[] {
  const set = new Set(keys);
  const before = set.size;
  for (const key of extra) set.add(key);
  return set.size === before ? (keys as TreeKey[]) : [...set];
}

/** 在 / 不在集合里来回切 */
export function toggleTreeKey(keys: readonly TreeKey[], key: TreeKey): TreeKey[] {
  return keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
}

/* ---------- 勾选联动 ---------- */

/**
 * 从 checkedKeys 推每个节点的勾选态。
 * 联动模式下：父在 keys 里则子（未禁用）都算勾上；子全勾上则父算勾上；部分勾上则父半选。
 */
export function computeTreeCheckStates(
  nodes: readonly TreeNode[],
  checkedKeys: readonly TreeKey[],
  checkStrictly: boolean,
): Map<TreeKey, TreeCheckState> {
  const set = new Set(checkedKeys);
  const map = new Map<TreeKey, TreeCheckState>();
  const walk = (node: TreeNode, inherited: boolean): TreeCheckState => {
    const own = set.has(node.key) || (inherited && !node.disabled);
    const children = node.children.map((child) => ({
      node: child,
      state: walk(child, !checkStrictly && own),
    }));
    let checked = own;
    let indeterminate = false;
    if (!checkStrictly && children.length > 0) {
      const enabled = children.filter((c) => !c.node.disabled);
      const all = enabled.length > 0 && enabled.every((c) => c.state.checked);
      checked = own || all;
      indeterminate = !checked && children.some((c) => c.state.checked || c.state.indeterminate);
    }
    const state = { checked, indeterminate };
    map.set(node.key, state);
    return state;
  };
  for (const node of nodes) walk(node, false);
  return map;
}

export function treeCheckState(
  states: ReadonlyMap<TreeKey, TreeCheckState>,
  key: TreeKey,
): TreeCheckState {
  return states.get(key) ?? TREE_UNCHECKED;
}

export interface NextCheckedOptions {
  node: TreeNode;
  checked: boolean;
  checkStrictly: boolean;
  checkedKeys: readonly TreeKey[];
  /** computeTreeCheckStates 的结果，联动模式下要拿它把"推出来的"勾选态落成完整集合 */
  states: ReadonlyMap<TreeKey, TreeCheckState>;
}

/** 勾一个节点之后，checkedKeys 应该变成什么 */
export function nextCheckedKeys(options: NextCheckedOptions): TreeKey[] {
  const { node, checked, checkStrictly, checkedKeys, states } = options;
  let set: Set<TreeKey>;
  if (checkStrictly) {
    set = new Set(checkedKeys);
    if (checked) set.add(node.key);
    else set.delete(node.key);
  } else {
    // 先把当前推出来的勾选态落成完整集合，再改这一支，最后沿祖先重算
    set = new Set([...states].filter(([, state]) => state.checked).map(([key]) => key));
    const apply = (n: TreeNode) => {
      if (checked) set.add(n.key);
      else set.delete(n.key);
      for (const child of n.children) if (!child.disabled) apply(child);
    };
    apply(node);
    for (let parent = node.parent; parent; parent = parent.parent) {
      const enabled = parent.children.filter((c) => !c.disabled);
      if (enabled.length > 0 && enabled.every((c) => set.has(c.key))) set.add(parent.key);
      else set.delete(parent.key);
    }
  }
  return [...set];
}

/* ---------- 可见节点 ---------- */

/** 当前看得见的节点，按屏幕顺序。遍历的是数据不是 DOM，服务端也算得出来 */
export function visibleTreeNodes(
  nodes: readonly TreeNode[],
  expanded: ReadonlySet<TreeKey>,
): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (list: readonly TreeNode[]) => {
    for (const node of list) {
      out.push(node);
      if (node.children.length > 0 && expanded.has(node.key)) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/* ---------- 键盘 ---------- */

export interface TreeKeyAction {
  /** 要不要吃掉这次按键 */
  prevent: boolean;
  kind: "none" | "focus" | "toggle" | "select";
  /** kind 为 focus 时，要聚焦到哪一行 */
  key?: TreeKey;
}

const NO_ACTION: TreeKeyAction = { prevent: false, kind: "none" };

export interface TreeKeyContext {
  nodes: readonly TreeNode[];
  expanded: ReadonlySet<TreeKey>;
  /** 事件是不是落在行本身（落在行里的勾选框上时，回车 / 空格交给它自己处理） */
  selfTarget: boolean;
  /**
   * 已经算好的可见序和这一行在里面的下标。不传就现遍历一遍树再查——MTree 几十行无所谓，
   * 虚拟树是给几万行准备的，每次按键都遍历全树不合适，它每次渲染本来就有一份现成的
   */
  visible?: readonly TreeNode[];
  index?: number;
}

/**
 * 行上按一个键该做什么。纯函数：进来的是键名和数据，出去的是一个动作，
 * 谁都不碰 DOM —— 真正去聚焦的是壳手里的 createTreeRows()。
 */
export function treeKeyAction(node: TreeNode, key: string, ctx: TreeKeyContext): TreeKeyAction {
  const list = ctx.visible ?? visibleTreeNodes(ctx.nodes, ctx.expanded);
  const index = ctx.index ?? list.findIndex((n) => n.key === node.key);
  const focusAt = (i: number): TreeKeyAction => {
    const target = list[i];
    return target ? { prevent: true, kind: "focus", key: target.key } : NO_ACTION;
  };
  const hasChildren = node.children.length > 0;
  const expanded = hasChildren && ctx.expanded.has(node.key);

  switch (key) {
    case "ArrowDown":
      return focusAt(index + 1);
    case "ArrowUp":
      return focusAt(index - 1);
    case "Home":
      return focusAt(0);
    case "End":
      return focusAt(list.length - 1);
    case "ArrowRight": {
      if (!hasChildren) return NO_ACTION;
      if (!expanded) return { prevent: true, kind: "toggle" };
      const first = node.children[0];
      return first
        ? { prevent: true, kind: "focus", key: first.key }
        : { prevent: true, kind: "none" };
    }
    case "ArrowLeft":
      if (expanded) return { prevent: true, kind: "toggle" };
      return node.parent
        ? { prevent: true, kind: "focus", key: node.parent.key }
        : { prevent: true, kind: "none" };
    case "Enter":
    case " ":
      // 焦点在行内的勾选框上时交给它自己处理
      return ctx.selfTarget ? { prevent: true, kind: "select" } : NO_ACTION;
    default:
      return NO_ACTION;
  }
}

/** key → 行元素。方向键要把焦点挪过去，非得拿着元素不可，所以这一小块 DOM 留在 core */
export interface TreeRows {
  set(key: TreeKey, el: HTMLElement | null): void;
  /** 聚焦一行。目标行不在表里（虚拟树滚出渲染窗口的行已下线）返回 false，调用方先滚过去再补聚焦 */
  focus(key: TreeKey): boolean;
}

export function createTreeRows(): TreeRows {
  const rows = new Map<TreeKey, HTMLElement>();
  return {
    set(key, el) {
      if (el) rows.set(key, el);
      else rows.delete(key);
    },
    focus(key) {
      const el = rows.get(key);
      if (!el) return false;
      el.focus();
      return true;
    },
  };
}

/* ---------- class 与样式 ---------- */

export interface TreeNodeState {
  expanded: boolean;
  selected: boolean;
  disabled: boolean;
  leaf: boolean;
}

/** MTree 节点外层（套着行和子树）的类名。两个壳都调它，才保证输出的字符串一模一样（顺序也一样） */
export function treeNodeClasses(state: TreeNodeState): string {
  const list = ["m-tree-node"];
  if (state.expanded) list.push("m-tree-node--expanded");
  if (state.selected) list.push("m-tree-node--selected");
  if (state.disabled) list.push("m-tree-node--disabled");
  if (state.leaf) list.push("m-tree-node--leaf");
  return list.join(" ");
}

export interface TreeRowState {
  expanded: boolean;
  selected: boolean;
  disabled: boolean;
}

/**
 * 行（箭头 + 勾选框 + 文字那一横条）的类名，皮肤在 internal/tree-row.css。
 * MTree 的行套在 .m-tree-node 里，MVirtualTree 的行本身就是 treeitem，两个组件共用这一套
 */
export function treeRowClasses(state: TreeRowState): string {
  const list = ["m-tree-row"];
  if (state.expanded) list.push("m-tree-row--expanded");
  if (state.selected) list.push("m-tree-row--selected");
  if (state.disabled) list.push("m-tree-row--disabled");
  return list.join(" ");
}

// 展开箭头在 m.ink 层换成毛边墨尖：全库共用一张，头一次用到时才生成（引用恒定，服务端也算得出来）
let treeInk: Record<string, string> | undefined;

export function treeInkStyle(): Record<string, string> {
  treeInk ??= { "--m-tree-tip-mask": `url("${inkTipUrl({ seed: 5, width: 9, height: 7 })}")` };
  return treeInk;
}
