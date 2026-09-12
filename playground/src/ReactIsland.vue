<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * 在 Vue 的文档站里挂一棵 React 树。
 * 两边 demo 因此跑在同一个页面、同一份样式、同一个墨迹引擎实例上 ——
 * 这本身就是"core 真的被共用了"的现场证明。iframe 做不到这点。
 */
const { component } = defineProps<{ component: ComponentType }>();
const host = useTemplateRef<HTMLElement>("host");
let root: Root | undefined;

onMounted(() => {
  root = createRoot(host.value!);
  root.render(createElement(component));
});
watch(
  () => component,
  (next) => root?.render(createElement(next)),
);
onBeforeUnmount(() => {
  // React 19 不许在渲染过程中同步 unmount，挪到下一个微任务
  const current = root;
  root = undefined;
  queueMicrotask(() => current?.unmount());
});
</script>

<template>
  <div ref="host" class="pg__island" />
</template>
