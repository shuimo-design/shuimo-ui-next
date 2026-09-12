<script setup lang="ts">
import type { TableColumnProps, TableColumnSlots } from "@shuimo-design/core";

/**
 * 标记组件：自己一个节点都不渲染。
 *
 * MTable 在**渲染期**遍历默认插槽返回的 vnode 数组，直接读这里的 props 和作用域插槽，
 * 拼成和 `columns` 属性一模一样的配置数组 —— 列序就是模板里的书写顺序，
 * 不用等挂载、也不比 DOM 位置，所以服务端渲染也排得对。
 */
defineOptions({ name: "MTableColumn" });
defineProps<TableColumnProps>();
defineSlots<TableColumnSlots>();
</script>

<template>
  <!-- 不渲染任何东西：这一列的表头和单元格由 MTable 画 -->
</template>
