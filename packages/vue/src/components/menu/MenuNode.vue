<script setup lang="ts">
import type { FunctionalComponent } from "vue";
import { useMenuContext, type MenuTreeNode } from "./context";
import MMenuItem from "./MMenuItem.vue";
import type { MenuLabelScope } from "./types";

defineOptions({ name: "MenuNode" });

const { node } = defineProps<{ node: MenuTreeNode }>();

const menu = useMenuContext();

/** 用函数组件把 MMenu 的 label 插槽渲染出来，递归层级里不用逐层转发插槽 */
const Label: FunctionalComponent<MenuLabelScope> = (scope) => menu.renderLabel(scope);
</script>

<template>
  <MMenuItem :name="node.key" :label="node.label" :disabled="node.disabled" :data="node.data">
    <template #label="{ item, level }">
      <Label :item="item" :level="level" />
    </template>
    <template v-if="node.children.length > 0" #default>
      <MenuNode v-for="child in node.children" :key="child.key" :node="child" />
    </template>
  </MMenuItem>
</template>
