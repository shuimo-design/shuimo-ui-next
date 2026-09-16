<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  MButton,
  MInputNumber,
  MVirtualTree,
  type TreeKey,
  type TreeNodeData,
  type VirtualTreeExpose,
} from "@shuimo-design/vue";

/** 120 个根 × 各 2 枝 × 各 3 叶，全部展开 840 行，不虚拟化会一次全渲染 */
const data: TreeNodeData[] = Array.from({ length: 120 }, (_, i) => ({
  key: `root-${i}`,
  label: `山 ${i}`,
  children: Array.from({ length: 2 }, (_, j) => ({
    key: `branch-${i}-${j}`,
    label: `岭 ${i}-${j}`,
    children: Array.from({ length: 3 }, (_, k) => ({
      key: `leaf-${i}-${j}-${k}`,
      label: `石 ${i}-${j}-${k}`,
    })),
  })),
}));

const expanded = ref<TreeKey[]>([]);
const checked = ref<TreeKey[]>([]);
const selected = ref<TreeKey | undefined>(undefined);
const target = ref(80);
const tree = useTemplateRef<VirtualTreeExpose>("tree");

function jump() {
  const i = Math.floor(target.value / 6);
  const j = Math.floor((target.value % 6) / 3);
  const k = target.value % 3;
  tree.value?.scrollToKey(`leaf-${i}-${j}-${k}`, "center");
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        840 行全部展开也只渲染可视区附近：展开 / 勾选联动 / 键盘（含 Home、End
        这种要跨窗口跳的）都和 MTree 一个口径
      </p>
      <MVirtualTree
        ref="tree"
        v-model:expanded-keys="expanded"
        v-model:checked-keys="checked"
        v-model:selected-key="selected"
        :data="data"
        :item-height="32"
        :height="280"
        checkable
        default-expand-all
      />
      <div class="demo__row">
        <MInputNumber v-model="target" :min="0" :max="839" />
        <MButton @click="jump">滚到第 {{ target }} 行的节点</MButton>
        <MButton @click="tree?.scrollTo(0)">回顶</MButton>
      </div>
    </div>
  </div>
</template>
