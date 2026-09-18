<script setup lang="ts">
import type { CarouselItemProps, CarouselItemSlots } from "@shuimo-design/core";

/**
 * 标记组件：自己一个节点都不渲染。
 *
 * MCarousel 在**渲染期**遍历默认插槽返回的 vnode 数组，直接读这里的 props 和插槽，
 * 拼成和 `items` 属性一模一样的配置数组 —— 顺序就是模板里的书写顺序，
 * 不用等挂载、也不比 DOM 位置，所以服务端渲染也排得对。等价的写法是给 MCarousel 传 `items`。
 */
defineOptions({ name: "MCarouselItem" });
defineProps<CarouselItemProps>();
defineSlots<CarouselItemSlots>();
</script>

<template>
  <!-- 不渲染任何东西：这一张由 MCarousel 画 -->
</template>
