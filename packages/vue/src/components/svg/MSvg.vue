<script setup lang="ts">
import { computed } from "vue";
import {
  svgClasses,
  svgInkKind,
  svgStyle,
  type SvgProps,
  type SvgSlots,
} from "@shuimo-design/core";
import { SVG_ICONS } from "./icons";

defineOptions({ name: "MSvg" });

const {
  name,
  ink = false,
  seed = 1,
  size,
  color,
  rotate = 0,
  spin = false,
  title,
} = defineProps<SvgProps>();
defineSlots<SvgSlots>();

const inkKind = computed(() => svgInkKind({ name, ink }));
// 名字 → 线性图标组件的那张表值是 Vue 组件，下沉不了，两个壳各有一份
const icon = computed(() => (name ? SVG_ICONS[name] : undefined));
const style = computed(() => svgStyle({ size, color, rotate, seed, inkKind: inkKind.value }));
</script>

<template>
  <span
    :class="svgClasses({ spin, inkKind })"
    :style="style"
    :role="title ? 'img' : undefined"
    :aria-label="title"
    :aria-hidden="title ? undefined : 'true'"
  >
    <span v-if="inkKind" class="m-svg__ink" />
    <component :is="icon" v-else-if="icon" />
    <slot v-else />
  </span>
</template>
