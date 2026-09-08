<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { useBrushBorder } from "../../ink/stroke";
import type { ButtonEmits, ButtonProps, ButtonSlots } from "./types";

defineOptions({ name: "MButton" });

const {
  type = "default",
  disabled = false,
  href,
  nativeType = "button",
} = defineProps<ButtonProps>();
const emit = defineEmits<ButtonEmits>();
defineSlots<ButtonSlots>();

const tag = computed(() => (href ? "a" : "button"));
const root = useTemplateRef<HTMLElement>("root");
useBrushBorder(root, { strokeWidth: 2.5 });

function onClick(event: MouseEvent) {
  if (disabled) {
    event.preventDefault();
    return;
  }
  emit("click", event);
}
</script>

<template>
  <component
    :is="tag"
    ref="root"
    class="m-button"
    :class="[`m-button--${type}`, { 'm-button--disabled': disabled }]"
    :href="href"
    :type="href ? undefined : nativeType"
    :disabled="href ? undefined : disabled"
    :aria-disabled="disabled || undefined"
    @click="onClick"
  >
    <span class="m-button__label"><slot /></span>
  </component>
</template>
