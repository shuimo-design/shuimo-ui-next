<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch, watchEffect, type Directive } from "vue";
import {
  buildTreeNodes,
  collectInitialExpanded,
  computeTreeCheckStates,
  createVirtualList,
  createVirtualTreeFocus,
  flattenVirtualTree,
  mergeTreeKeys,
  nextCheckedKeys,
  resolveTreeFields,
  toggleTreeKey,
  treeCheckState,
  treeInkStyle,
  treeKeyAction,
  treeRowClasses,
  virtualListBodyStyle,
  virtualListItemStyle,
  virtualListOffsets,
  virtualListPhantomStyle,
  virtualListRange,
  virtualListTotalHeight,
  virtualTreeClasses,
  virtualTreeResumesFocus,
  virtualTreeRootStyle,
  virtualTreeRowIndexes,
  TREE_COLLAPSE_LABEL,
  TREE_EXPAND_LABEL,
  type TreeKey,
  type TreeNode as TreeNodeType,
  type VirtualTreeEmits,
  type VirtualTreeExpose,
  type VirtualTreeProps,
  type VirtualTreeSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import { MCheckbox } from "../checkbox";

defineOptions({ name: "MVirtualTree" });

const {
  data,
  fieldNames,
  checkable = false,
  checkStrictly = false,
  defaultExpandAll = false,
  selectable = true,
  itemHeight,
  estimatedItemHeight = 32,
  buffer = 5,
  height,
} = defineProps<VirtualTreeProps>();
const emit = defineEmits<VirtualTreeEmits>();
defineSlots<VirtualTreeSlots>();
/** 展开的节点 key */
const expandedKeys = defineModel<TreeKey[]>("expandedKeys", { default: () => [] });
/** 勾选的节点 key（只含复选框真正勾上的，半选不算） */
const checkedKeys = defineModel<TreeKey[]>("checkedKeys", { default: () => [] });
/** 当前高亮的节点 key */
const selectedKey = defineModel<TreeKey | undefined>("selectedKey");

/* ---------- 树：与 MTree 同一套 core 函数 ---------- */

const fields = computed(() => resolveTreeFields(fieldNames));
// 一次性建出带 parent / level 的完整树：勾选联动和方向键都遍历它，不靠 provide 逐层冒泡
const nodes = computed(() => buildTreeNodes(data, fields.value));

// 初始展开（defaultExpandAll 或数据里标了 expand 的）只在建起来时算一次，之后完全由 v-model:expandedKeys 接管
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

/* ---------- 虚拟化：摊平的可见行就是列表项，控制器与 MVirtualList 同一个 ---------- */

const rows = computed(() => flattenVirtualTree(nodes.value, expandedSet.value));
// 按键和 scrollToKey 都按这两份查，展开序变一次算一次，不用每次按键都遍历全树
const rowIndexes = computed(() => virtualTreeRowIndexes(rows.value));
const visibleNodes = computed(() => rows.value.map((row) => row.node));

const { controller: vtree, state } = useController(createVirtualList, () => ({
  itemHeight,
  estimatedItemHeight,
  buffer,
  onScroll: (top: number) => emit("scroll", top),
}));

const viewport = useTemplateRef<HTMLElement>("viewport");
// flush: "post" —— 元素真的渲染出来了再交给控制器装监听
watchEffect(() => vtree.setViewport(viewport.value), { flush: "post" });
// 展开集合一变，行序整个重排，量过的行高全部作废（判断在 core 的 setItems 里）
watch(rows, (next) => vtree.setItems(next), { immediate: true });

// 量到的行高表一直是同一个 Map，靠版本号当"变了"的信号
const version = computed(() => state.value.version);
const offsets = computed(() => {
  void version.value;
  return virtualListOffsets({
    count: rows.value.length,
    itemHeight,
    estimatedItemHeight,
    measured: state.value.measured,
  });
});
const range = computed(() =>
  virtualListRange({
    offsets: offsets.value,
    count: rows.value.length,
    scrollTop: state.value.scrollTop,
    viewportHeight: state.value.viewportHeight,
    buffer,
  }),
);
const visible = computed(() => rows.value.slice(range.value.start, range.value.end));

const rootStyle = computed(() => ({ ...treeInkStyle(), ...virtualTreeRootStyle(height) }));
const phantomStyle = computed(() =>
  virtualListPhantomStyle(virtualListTotalHeight(offsets.value, rows.value.length)),
);
const bodyStyle = computed(() => virtualListBodyStyle(offsets.value, range.value.start));
const itemStyle = computed(() => virtualListItemStyle(itemHeight));

function rowClasses(node: TreeNodeType): string {
  return treeRowClasses({
    expanded: node.children.length > 0 && expandedSet.value.has(node.key),
    selected: selectedKey.value === node.key,
    disabled: node.disabled,
  });
}

/* ---------- 焦点：行元素表在 core；目标行不在渲染窗口时先滚过去，挂上来再补聚焦 ---------- */

const rowEls = createVirtualTreeFocus();
watchEffect(() => rowEls.setHost(viewport.value), { flush: "post" });
const pendingFocus = ref<TreeKey | null>(null);

function focusKey(key: TreeKey) {
  if (rowEls.focus(key)) return;
  const index = rowIndexes.value.get(key);
  if (index === undefined) return;
  pendingFocus.value = key;
  vtree.scrollTo(index, "start");
}

/** 焦点行被鼠标滚出窗口后焦点在容器上：方向键先把焦点送回那一行，再按一次就是正常的行为 */
function hostKeydown(event: KeyboardEvent) {
  const active = rowEls.activeKey();
  if (active === null || !virtualTreeResumesFocus(event.key)) return;
  event.preventDefault();
  focusKey(active);
}

// 渲染窗口每变一次都试一次，目标行挂上来的那一轮 DOM 更新之后补上焦点。
// 依赖里带上 visible：变高模式下 scrollTo 要几帧才停稳，第一轮不一定挂上来，只盯 pendingFocus 就没有第二次机会
watch(
  [visible, pendingFocus],
  () => {
    if (pendingFocus.value === null) return;
    if (rowEls.focus(pendingFocus.value)) pendingFocus.value = null;
  },
  { flush: "post" },
);

/* ---------- 动作：与 MTree 的接法一字不差 ---------- */

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

function keydown(node: TreeNodeType, index: number, event: KeyboardEvent, selfTarget: boolean) {
  const action = treeKeyAction(node, event.key, {
    nodes: nodes.value,
    expanded: expandedSet.value,
    selfTarget,
    visible: visibleNodes.value,
    index,
  });
  if (action.prevent) event.preventDefault();
  if (action.kind === "focus" && action.key !== undefined) focusKey(action.key);
  else if (action.kind === "toggle") toggleExpand(node);
  else if (action.kind === "select") select(node, event);
}

/** 每一行挂上 / 卸下都告诉控制器一声，量尺寸的观察器由它管（定高模式下是空操作） */
const vMeasure: Directive<HTMLElement> = {
  mounted: (el) => vtree.observeItem(el),
  beforeUnmount: (el) => vtree.releaseItem(el),
};

/**
 * 行的可达名称指向 label 本身：行是平铺的，箭头按钮和勾选框都在 treeitem 里，
 * 不指名的话它们的文字会被拼进行名。后缀用摊平下标——行内唯一、不含空格、SSR 两边算得出。
 */
const uid = useId();
const labelId = (index: number): string => `${uid}-${index}`;

defineExpose<VirtualTreeExpose>({
  scrollToKey: (key, align) => {
    const index = rowIndexes.value.get(key);
    if (index !== undefined) vtree.scrollTo(index, align);
  },
  scrollTo: vtree.scrollTo,
  scrollToOffset: vtree.scrollToOffset,
  scrollTop: vtree.scrollTop,
});
</script>

<template>
  <!-- tabindex=-1：Tab 不会停在容器上，只用来在焦点行被卸掉时接住焦点；.self 只管落在容器本身的按键 -->
  <div
    ref="viewport"
    :class="virtualTreeClasses()"
    :style="rootStyle"
    role="tree"
    tabindex="-1"
    @keydown.self="hostKeydown"
  >
    <!-- 占位层撑出总高度让滚动条正确，可见的那批行由 body 平移到位 -->
    <div class="m-virtual-tree__phantom" :style="phantomStyle" />
    <div class="m-virtual-tree__body" :style="bodyStyle">
      <div
        v-for="(row, i) in visible"
        :key="row.node.key"
        v-measure
        :ref="(el) => rowEls.set(row.node.key, (el as HTMLElement | null) ?? null)"
        :data-index="range.start + i"
        :class="rowClasses(row.node)"
        :style="{ '--m-tree-level': row.node.level, ...itemStyle }"
        role="treeitem"
        :aria-labelledby="labelId(range.start + i)"
        :aria-level="row.node.level + 1"
        :aria-posinset="row.posInSet"
        :aria-setsize="row.setSize"
        :aria-expanded="row.node.children.length > 0 ? expandedSet.has(row.node.key) : undefined"
        :aria-selected="selectedKey === row.node.key"
        :aria-disabled="row.node.disabled || undefined"
        tabindex="0"
        @click="select(row.node, $event)"
        @focusin="rowEls.setActive(row.node.key)"
        @keydown="
          keydown(row.node, range.start + i, $event, $event.target === $event.currentTarget)
        "
      >
        <button
          v-if="row.node.children.length > 0"
          type="button"
          class="m-tree-row__arrow"
          tabindex="-1"
          :aria-label="expandedSet.has(row.node.key) ? TREE_COLLAPSE_LABEL : TREE_EXPAND_LABEL"
          @click.stop="toggleExpand(row.node)"
        >
          <!-- 实心小三角，形状全靠 CSS（m.ink 层换成毛边墨尖遮罩），转向也在它身上 -->
          <span class="m-tree-row__arrow-shape" />
        </button>
        <span v-else class="m-tree-row__arrow m-tree-row__arrow--placeholder" aria-hidden="true" />
        <MCheckbox
          v-if="checkable"
          class="m-tree-row__checkbox"
          :model-value="treeCheckState(checkStates, row.node.key).checked"
          :indeterminate="treeCheckState(checkStates, row.node.key).indeterminate"
          :disabled="row.node.disabled"
          @click.stop
          @update:model-value="(value: boolean) => setChecked(row.node, value)"
        />
        <span :id="labelId(range.start + i)" class="m-tree-row__label">
          <slot :node="row.node" :level="row.node.level">{{ row.node.label }}</slot>
        </span>
      </div>
    </div>
  </div>
</template>
