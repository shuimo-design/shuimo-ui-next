<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  useId,
  useTemplateRef,
  type FunctionalComponent,
} from "vue";
import { MCheckbox } from "../checkbox";
import { treeKey } from "./context";
import type { TreeLabelScope, TreeNode } from "./types";

defineOptions({ name: "TreeNode" });

const { node } = defineProps<{ node: TreeNode }>();

const tree = inject(treeKey);
if (!tree) throw new Error("TreeNode 只能放在 MTree 里用");

const labelId = useId();
const row = useTemplateRef<HTMLElement>("row");

const hasChildren = computed(() => node.children.length > 0);
const expanded = computed(() => hasChildren.value && tree.isExpanded(node.key));
const selected = computed(() => tree.selectedKey.value === node.key);
const check = computed(() => tree.checkState(node.key));

/** 用函数组件把上下文里的插槽渲染出来，递归层级里不用逐层转发插槽 */
const Label: FunctionalComponent<TreeLabelScope> = (scope) => tree.renderLabel(scope);

onMounted(() => tree.registerRow(node.key, row.value));
onBeforeUnmount(() => tree.registerRow(node.key, null));
</script>

<template>
  <div
    class="m-tree-node"
    :class="{
      'm-tree-node--expanded': expanded,
      'm-tree-node--selected': selected,
      'm-tree-node--disabled': node.disabled,
      'm-tree-node--leaf': !hasChildren,
    }"
    :style="{ '--m-tree-level': node.level }"
    role="treeitem"
    :aria-expanded="hasChildren ? expanded : undefined"
    :aria-selected="selected"
    :aria-disabled="node.disabled || undefined"
    :aria-level="node.level + 1"
    :aria-labelledby="labelId"
  >
    <div
      ref="row"
      class="m-tree-node__row"
      tabindex="0"
      @click="tree.select(node, $event)"
      @keydown="tree.onKeydown(node, $event)"
    >
      <button
        v-if="hasChildren"
        type="button"
        class="m-tree-node__arrow"
        tabindex="-1"
        :aria-label="expanded ? '收起' : '展开'"
        @click.stop="tree.toggleExpand(node)"
      >
        <!-- 实心小三角，形状全靠 CSS（m.ink 层换成毛边墨尖遮罩），转向也在它身上 -->
        <span class="m-tree-node__arrow-shape" />
      </button>
      <span v-else class="m-tree-node__arrow m-tree-node__arrow--placeholder" aria-hidden="true" />
      <MCheckbox
        v-if="tree.checkable.value"
        class="m-tree-node__checkbox"
        :model-value="check.checked"
        :indeterminate="check.indeterminate"
        :disabled="node.disabled"
        @click.stop
        @update:model-value="(value: boolean) => tree.setChecked(node, value)"
      />
      <span :id="labelId" class="m-tree-node__label">
        <Label :node="node" :level="node.level" />
      </span>
    </div>
    <div v-if="hasChildren" class="m-tree-node__children" role="group">
      <div class="m-tree-node__children-inner" :inert="!expanded">
        <TreeNode v-for="child in node.children" :key="child.key" :node="child" />
      </div>
    </div>
  </div>
</template>
