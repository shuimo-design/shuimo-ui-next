<script setup lang="ts">
import { computed, provide, type VNodeChild } from "vue";
import {
  buildTreeNodes,
  collectInitialExpanded,
  computeTreeCheckStates,
  createTreeRows,
  mergeTreeKeys,
  nextCheckedKeys,
  resolveTreeFields,
  toggleTreeKey,
  treeInkStyle,
  treeKeyAction,
  type TreeEmits,
  type TreeKey,
  type TreeLabelScope,
  type TreeNode as TreeNodeType,
  type TreeProps,
  type TreeSlots,
} from "@shuimo-design/core";
import { treeKey } from "./context";
import TreeNode from "./TreeNode.vue";

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

const fields = computed(() => resolveTreeFields(fieldNames));
// 一次性建出带 parent / level 的完整树：勾选联动和方向键都遍历它，不靠 provide 逐层冒泡
const nodes = computed(() => buildTreeNodes(data, fields.value));

// 初始展开（defaultExpandAll 或数据里标了 expand 的）只在建起来时算一次，之后完全由 v-model:expandedKeys 说了算
const initialExpanded = mergeTreeKeys(
  expandedKeys.value,
  collectInitialExpanded(nodes.value, fields.value, defaultExpandAll),
);
// 一个都没新增时 mergeTreeKeys 原样返回，引用相同就不写回，免得白发一次事件
if (initialExpanded !== expandedKeys.value) expandedKeys.value = initialExpanded;

const expandedSet = computed(() => new Set(expandedKeys.value));
const checkStates = computed(() =>
  computeTreeCheckStates(nodes.value, checkedKeys.value, checkStrictly),
);

// 方向键要把焦点挪到另一行上，得拿着行元素：这张表在 core 里
const rows = createTreeRows();

function toggleExpand(node: TreeNodeType) {
  if (node.children.length === 0) return;
  const expanded = expandedSet.value.has(node.key);
  expandedKeys.value = toggleTreeKey(expandedKeys.value, node.key);
  emit("expand", node, !expanded);
}

function setChecked(node: TreeNodeType, checked: boolean) {
  const next = nextCheckedKeys({
    node,
    checked,
    checkStrictly,
    checkedKeys: checkedKeys.value,
    states: checkStates.value,
  });
  checkedKeys.value = next;
  emit("check", node, next);
}

function select(node: TreeNodeType, event: MouseEvent | KeyboardEvent) {
  if (node.disabled) return;
  emit("nodeClick", node, event);
  if (selectable) selectedKey.value = node.key;
}

function keydown(node: TreeNodeType, event: KeyboardEvent, selfTarget: boolean) {
  const action = treeKeyAction(node, event.key, {
    nodes: nodes.value,
    expanded: expandedSet.value,
    selfTarget,
  });
  if (action.prevent) event.preventDefault();
  if (action.kind === "focus" && action.key !== undefined) rows.focus(action.key);
  else if (action.kind === "toggle") toggleExpand(node);
  else if (action.kind === "select") select(node, event);
}

function renderLabel(scope: TreeLabelScope): VNodeChild {
  return (slots.default ? slots.default(scope) : scope.node.label) as VNodeChild;
}

// 值字段写成 getter：Vue 要在子组件读的那一刻才建立依赖，存好的普通值追不到更新
provide(treeKey, {
  get checkable() {
    return checkable;
  },
  get selectedKey() {
    return selectedKey.value;
  },
  get expanded() {
    return expandedSet.value;
  },
  get checkStates() {
    return checkStates.value;
  },
  toggleExpand,
  setChecked,
  select,
  keydown,
  registerRow: rows.set,
  renderLabel,
});
</script>

<template>
  <div class="m-tree" role="tree" :style="treeInkStyle()">
    <TreeNode v-for="node in nodes" :key="node.key" :node="node" />
  </div>
</template>
