<script setup lang="ts">
import { computed } from "vue";
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
