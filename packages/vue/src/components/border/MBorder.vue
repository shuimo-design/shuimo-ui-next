<script setup lang="ts">
import { computed, reactive, useTemplateRef, watch, watchEffect } from "vue";
import {
  borderClasses,
  borderSides,
  borderStroke,
  borderStyle,
  type BorderProps,
  type BorderSlots,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";

defineOptions({ name: "MBorder" });

const {
  tag = "div",
  // border 和四个单边开关必须直接从 defineProps() 上解构、并写出默认值：
  // 类型里带 boolean 的 prop，Vue 会做 Boolean 转型——不传会变成 false。
  // border 的"不传"要当 true，四个单边开关的"不传"要保持 undefined（表示听 border 的）。
  border = true,
  top = undefined,
  right = undefined,
  bottom = undefined,
  left = undefined,
  // 剩下这些原样递给 core，默认值（seed / 笔宽 / 粗糙度 / 飞白）由 core 归一化，两个壳共用一份
  mask,
  seed,
  strokeWidth,
  roughness,
  flyingWhite,
  color,
  padding,
} = defineProps<BorderProps>();
defineSlots<BorderSlots>();

/** 转型过的这份 props 才是 core 的输入 */
const props = computed<BorderProps>(() => ({
  tag,
  border,
  top,
  right,
  bottom,
  left,
  mask,
  seed,
  strokeWidth,
  roughness,
  flyingWhite,
  color,
  padding,
}));
const sides = computed(() => borderSides(props.value));
const stroke = computed(() => borderStroke(props.value, sides.value));

const root = useTemplateRef<HTMLElement>("root");
// useBrushBorder 内部用 watchEffect 读这个对象，所以它必须是响应式的：
// 把 core 算出来的笔触参数同步进一个 reactive，props 一变控制器就能读到新值
const strokeOptions = reactive({ ...stroke.value });
watchEffect(() => Object.assign(strokeOptions, stroke.value));
const { update } = useBrushBorder(root, strokeOptions);
// 参数变了要强制重画：元素尺寸没变，控制器不会自己重新落笔
watch(stroke, () => update(), { flush: "post" });
</script>

<template>
  <component :is="tag" ref="root" :class="borderClasses(props, sides)" :style="borderStyle(props)">
    <slot />
  </component>
</template>
