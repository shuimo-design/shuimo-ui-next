<script setup lang="ts">
import { computed } from "vue";
import {
  emptyClasses,
  emptyHasFigure,
  emptyStyle,
  EMPTY_DESCRIPTION,
  type EmptyProps,
  type EmptySlots,
} from "@shuimo-design/core";

defineOptions({ name: "MEmpty" });

const {
  description = EMPTY_DESCRIPTION,
  imageSize = 120,
  image = "enso",
  seed = 1,
} = defineProps<EmptyProps>();
const slots = defineSlots<EmptySlots>();

// 给了 image 插槽就不生成内置插图；插槽的有无是框架概念，只能在壳里判断，再交给 core 派生
const figure = computed(() => ({ image, imageSize, seed, custom: Boolean(slots.image) }));
</script>

<template>
  <div :class="emptyClasses(figure)" :style="emptyStyle(figure)">
    <div v-if="emptyHasFigure(figure)" class="m-empty__image" aria-hidden="true">
      <slot name="image"><span class="m-empty__figure" /></slot>
    </div>
    <p class="m-empty__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="slots.default" class="m-empty__extra"><slot /></div>
  </div>
</template>
