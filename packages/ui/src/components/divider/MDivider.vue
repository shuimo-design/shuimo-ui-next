<script setup lang="ts">
import "./divider.css";
import { computed, useTemplateRef } from "vue";
import type { DividerProps, DividerSlots } from "./types";
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

const hasText = computed(() => Boolean(slots.default || text));
// 有文字时是两段线，各自量长度、各自生成；第二段换个种子，免得左右两笔飞白位置对称
const head = useTemplateRef<HTMLElement>("head");
const tail = useTemplateRef<HTMLElement>("tail");
useBrushLine(head, { thickness, seed, vertical: () => vertical });
useBrushLine(tail, { thickness, seed: seed + 11, vertical: () => vertical });
</script>

<template>
  <div
    class="m-divider"
    :class="[
      `m-divider--${align}`,
      { 'm-divider--vertical': vertical, 'm-divider--with-text': hasText },
    ]"
    :style="{ '--m-divider-thickness': `${thickness}px` }"
    role="separator"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'"
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
