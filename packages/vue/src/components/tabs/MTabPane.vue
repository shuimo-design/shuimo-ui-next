<script setup lang="ts">
import type { TabPaneProps, TabPaneSlots } from "@shuimo-design/core";

/**
 * 标记组件：自己一个节点都不渲染。
 *
 * MTabs 在**渲染期**遍历默认插槽返回的 vnode 数组，直接读这里的 props 和插槽，
 * 拼成和 `panes` 属性一模一样的配置数组 —— 顺序就是模板里的书写顺序，不碰 DOM、不等挂载，
 * 所以服务端渲染也排得对。等价的写法是给 MTabs 传 `panes`。
 */
defineOptions({ name: "MTabPane" });
defineProps<TabPaneProps>();
defineSlots<TabPaneSlots>();
</script>

<template>
  <!-- 不渲染任何东西：内容由 MTabs 放进自己的面板里 -->
</template>
