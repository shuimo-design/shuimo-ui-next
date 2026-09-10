<script setup lang="ts">
import "./tree.css";
import { computed, provide, toRef, type VNodeChild } from "vue";
import { inkTipUrl } from "../../ink/assets/tip";
import { treeKey, type TreeCheckState } from "./context";
import TreeNode from "./TreeNode.vue";
import type {
  TreeEmits,
  TreeKey,
  TreeLabelScope,
  TreeNode as TreeNodeType,
  TreeNodeData,
  TreeProps,
  TreeSlots,
} from "./types";

defineOptions({ name: "MTree" });

const {
  data,
  fieldNames,
  checkable = false,
  checkStrictly = false,
  defaultExpandAll = false,
  selectable = true,
} = defineProps<TreeProps>();
const emit = defineEmits<TreeEmits>();
const slots = defineSlots<TreeSlots>();
const expandedKeys = defineModel<TreeKey[]>("expandedKeys", { default: () => [] });
const checkedKeys = defineModel<TreeKey[]>("checkedKeys", { default: () => [] });
const selectedKey = defineModel<TreeKey | undefined>("selectedKey");

const fields = computed(() => ({
  key: fieldNames?.key ?? "key",
  label: fieldNames?.label ?? "label",
  children: fieldNames?.children ?? "children",
  disabled: fieldNames?.disabled ?? "disabled",
  expand: fieldNames?.expand ?? "expand",
}));

// 展开箭头在 m.ink 层换成毛边墨尖：按种子生成一次，写成根上的 CSS 变量给所有节点共用
const inkStyle = {
  "--m-tree-tip-mask": `url("${inkTipUrl({ seed: 5, width: 9, height: 7 })}")`,
};

function isDataList(value: unknown): value is TreeNodeData[] {
  return Array.isArray(value);
}

/** 把原始数据整理成带 parent / level 的节点树；没 key 的节点按路径补一个 */
function build(
  items: TreeNodeData[],
  level: number,
  parent: TreeNodeType | undefined,
  path: string,
): TreeNodeType[] {
  const f = fields.value;
  return items.map((raw, index) => {
    const rawKey = raw[f.key];
    const key =
      typeof rawKey === "string" || typeof rawKey === "number" ? rawKey : `${path}${index}`;
    const node: TreeNodeType = {
      key,
      label: String(raw[f.label] ?? ""),
      disabled: Boolean(raw[f.disabled]),
      level,
      children: [],
      parent,
      data: raw,
    };
    const children = raw[f.children];
    node.children = isDataList(children) ? build(children, level + 1, node, `${key}-`) : [];
    return node;
  });
}

const nodes = computed(() => build(data, 0, undefined, ""));

/** 初始要展开的父节点：defaultExpandAll 全收，否则只收数据里标了 expand 的 */
function collectInitialExpanded(list: TreeNodeType[], out: TreeKey[] = []): TreeKey[] {
  for (const node of list) {
    if (node.children.length > 0) {
      if (defaultExpandAll || node.data[fields.value.expand] === true) out.push(node.key);
      collectInitialExpanded(node.children, out);
    }
  }
  return out;
}

const initialExpanded = collectInitialExpanded(nodes.value);
if (initialExpanded.length > 0) {
  expandedKeys.value = [...new Set([...expandedKeys.value, ...initialExpanded])];
}

/* ---------- 展开 ---------- */

const expandedSet = computed(() => new Set(expandedKeys.value));

function isExpanded(key: TreeKey): boolean {
  return expandedSet.value.has(key);
}

function toggleExpand(node: TreeNodeType) {
  if (node.children.length === 0) return;
  const expanded = isExpanded(node.key);
  expandedKeys.value = expanded
    ? expandedKeys.value.filter((k) => k !== node.key)
    : [...expandedKeys.value, node.key];
  emit("expand", node, !expanded);
}

/* ---------- 勾选 ---------- */

/**
 * 从 checkedKeys 推每个节点的勾选态。
 * 联动模式下：父在 keys 里则子（未禁用）都算勾上；子全勾上则父算勾上；部分勾上则父半选。
 */
const checkStates = computed(() => {
  const set = new Set(checkedKeys.value);
  const map = new Map<TreeKey, TreeCheckState>();
  const walk = (node: TreeNodeType, inherited: boolean): TreeCheckState => {
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
  for (const node of nodes.value) walk(node, false);
  return map;
});

const uncheckedState: TreeCheckState = { checked: false, indeterminate: false };

function checkState(key: TreeKey): TreeCheckState {
  return checkStates.value.get(key) ?? uncheckedState;
}

function setChecked(node: TreeNodeType, checked: boolean) {
  let set: Set<TreeKey>;
  if (checkStrictly) {
    set = new Set(checkedKeys.value);
    if (checked) set.add(node.key);
    else set.delete(node.key);
  } else {
    // 先把当前推出来的勾选态落成完整集合，再改这一支，最后沿祖先重算
    set = new Set([...checkStates.value].filter(([, state]) => state.checked).map(([key]) => key));
    const apply = (n: TreeNodeType) => {
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
  const next = [...set];
  checkedKeys.value = next;
  emit("check", node, next);
}

/* ---------- 选中 ---------- */

function select(node: TreeNodeType, event: MouseEvent | KeyboardEvent) {
  if (node.disabled) return;
  emit("nodeClick", node, event);
  if (selectable) selectedKey.value = node.key;
}

/* ---------- 键盘 ---------- */

const rows = new Map<TreeKey, HTMLElement>();

function registerRow(key: TreeKey, el: HTMLElement | null) {
  if (el) rows.set(key, el);
  else rows.delete(key);
}

function focusRow(key: TreeKey) {
  rows.get(key)?.focus();
}

/** 当前看得见的节点，按屏幕顺序 */
function visibleNodes(): TreeNodeType[] {
  const out: TreeNodeType[] = [];
  const walk = (list: TreeNodeType[]) => {
    for (const node of list) {
      out.push(node);
      if (node.children.length > 0 && isExpanded(node.key)) walk(node.children);
    }
  };
  walk(nodes.value);
  return out;
}

function onKeydown(node: TreeNodeType, event: KeyboardEvent) {
  const list = visibleNodes();
  const index = list.findIndex((n) => n.key === node.key);
  const focusAt = (i: number) => {
    const target = list[i];
    if (!target) return;
    event.preventDefault();
    focusRow(target.key);
  };
  switch (event.key) {
    case "ArrowDown":
      focusAt(index + 1);
      break;
    case "ArrowUp":
      focusAt(index - 1);
      break;
    case "Home":
      focusAt(0);
      break;
    case "End":
      focusAt(list.length - 1);
      break;
    case "ArrowRight":
      if (node.children.length === 0) return;
      event.preventDefault();
      if (isExpanded(node.key)) {
        const first = node.children[0];
        if (first) focusRow(first.key);
      } else {
        toggleExpand(node);
      }
      break;
    case "ArrowLeft":
      event.preventDefault();
      if (node.children.length > 0 && isExpanded(node.key)) toggleExpand(node);
      else if (node.parent) focusRow(node.parent.key);
      break;
    case "Enter":
    case " ":
      // 焦点在行内的勾选框上时交给它自己处理
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      select(node, event);
      break;
    default:
  }
}

function renderLabel(scope: TreeLabelScope): VNodeChild {
  return (slots.default ? slots.default(scope) : scope.node.label) as VNodeChild;
}

provide(treeKey, {
  checkable: toRef(() => checkable),
  selectedKey,
  isExpanded,
  checkState,
  toggleExpand,
  setChecked,
  select,
  onKeydown,
  registerRow,
  renderLabel,
});
</script>

<template>
  <div class="m-tree" role="tree" :style="inkStyle">
    <TreeNode v-for="node in nodes" :key="node.key" :node="node" />
  </div>
</template>
