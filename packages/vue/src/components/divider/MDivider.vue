<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import {
  dividerClasses,
  dividerLineOptions,
  dividerOrientation,
  dividerStyle,
  type DividerProps,
  type DividerSlots,
} from "@shuimo-design/core";
import { useBrushLine } from "./use-brush-line";

defineOptions({ name: "MDivider" });

const {
  vertical = false,
  text,
  align = "center",
  thickness = 4,
  seed = 1,
} = defineProps<DividerProps>();
const slots = defineSlots<DividerSlots>();

// 插槽的有无是框架概念，只能在壳里判断
const hasText = computed(() => Boolean(slots.default || text));

// 有文字时是两段线，各自量长度、各自生成；尾段的种子在 core 里错开，免得左右两笔的飞白对称。
// 方向改回 getter 传：横竖切换要重画；粗细和种子和旧版一样只在挂载时取一次
const line: DividerProps = { vertical, thickness, seed };
const head = useTemplateRef<HTMLElement>("head");
const tail = useTemplateRef<HTMLElement>("tail");
useBrushLine(head, { ...dividerLineOptions(line), vertical: () => vertical });
useBrushLine(tail, { ...dividerLineOptions(line, true), vertical: () => vertical });
</script>

<template>
  <div
    :class="dividerClasses({ align, vertical, hasText })"
    :style="dividerStyle({ thickness })"
    role="separator"
    :aria-orientation="dividerOrientation({ vertical })"
  >
    <span ref="head" class="m-divider__line m-divider__line--head" aria-hidden="true" />
    <template v-if="hasText">
      <span class="m-divider__text"
        ><slot>{{ text }}</slot></span
      >
      <span ref="tail" class="m-divider__line m-divider__line--tail" aria-hidden="true" />
    </template>
  </div>
</template>
