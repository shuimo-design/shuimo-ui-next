<script setup lang="ts">
import "./svg.css";
import { computed } from "vue";
import { inkMarkUrl } from "../../ink/assets/mark";
import { SVG_ICONS, SVG_INK_MARKS } from "./icons";
import type { SvgProps, SvgSlots } from "./types";

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

// 只有素材库里有对应记号的名字才走笔触版，其余静默回落到线性版
const inkKind = computed(() => (ink && name ? SVG_INK_MARKS[name] : undefined));
const icon = computed(() => (name ? SVG_ICONS[name] : undefined));

const style = computed(() => ({
  fontSize: typeof size === "number" ? `${size}px` : size,
  color,
  "--m-svg-rotate": rotate ? `${rotate}deg` : undefined,
  "--m-svg-mask": inkKind.value ? `url("${inkMarkUrl(inkKind.value, { seed })}")` : undefined,
}));
</script>

<template>
  <span
    class="m-svg"
    :class="{ 'm-svg--spin': spin, 'm-svg--ink': inkKind }"
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
