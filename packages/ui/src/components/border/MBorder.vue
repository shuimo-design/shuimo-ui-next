<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useBrushBorder } from "../../ink/stroke";
import type { BorderProps, BorderSlots } from "./types";

defineOptions({ name: "MBorder" });

const {
  seed = 1,
  strokeWidth = 3,
  roughness,
  flyingWhite,
  tag = "div",
} = defineProps<BorderProps>();
defineSlots<BorderSlots>();

const root = useTemplateRef<HTMLElement>("root");
useBrushBorder(root, { seed, strokeWidth, roughness, flyingWhite });
</script>

<template>
  <component :is="tag" ref="root" class="m-border">
    <div class="m-border__content"><slot /></div>
  </component>
</template>
