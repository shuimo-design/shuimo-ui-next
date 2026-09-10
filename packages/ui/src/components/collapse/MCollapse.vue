<script setup lang="ts">
import "./collapse.css";
import { provide, toRef } from "vue";
import { collapseKey } from "./context";
import type { CollapseEmits, CollapseName, CollapseProps, CollapseSlots } from "./types";

defineOptions({ name: "MCollapse" });

const { accordion = false, divider = true, disabled = false } = defineProps<CollapseProps>();
const emit = defineEmits<CollapseEmits>();
defineSlots<CollapseSlots>();
const model = defineModel<CollapseName | CollapseName[]>();

/** 统一成数组读，单值 / 未设置都能处理 */
function activeNames(): CollapseName[] {
  const value = model.value;
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function isActive(name: CollapseName): boolean {
  return activeNames().includes(name);
}

function toggle(name: CollapseName) {
  const active = isActive(name);
  let next: CollapseName | CollapseName[] | undefined;
  if (accordion) {
    next = active ? undefined : name;
  } else {
    next = active ? activeNames().filter((n) => n !== name) : [...activeNames(), name];
  }
  model.value = next;
  emit("change", next);
}

provide(collapseKey, {
  isActive,
  toggle,
  divider: toRef(() => divider),
  disabled: toRef(() => disabled),
});
</script>

<template>
  <div class="m-collapse" :class="{ 'm-collapse--disabled': disabled }">
    <slot />
  </div>
</template>
