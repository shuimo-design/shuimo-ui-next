<script setup lang="ts">
import { computed, provide } from "vue";
import {
  collapseActiveNames,
  collapseClasses,
  collapseNextModel,
  type CollapseContextValue,
  type CollapseEmits,
  type CollapseName,
  type CollapseProps,
  type CollapseSlots,
} from "@shuimo-design/core";
import { collapseKey } from "./context";

defineOptions({ name: "MCollapse" });

const { accordion = false, divider = true, disabled = false } = defineProps<CollapseProps>();
const emit = defineEmits<CollapseEmits>();
defineSlots<CollapseSlots>();
// 手风琴下是单个 name，普通模式下是 name 数组；两种形状的换算在 core 里
const model = defineModel<CollapseName | CollapseName[]>();

function toggle(name: CollapseName) {
  const next = collapseNextModel(model.value, name, accordion);
  model.value = next;
  emit("change", next);
}

// 上下文装成 computed：展开项 / divider / 禁用任一变了，读它的子项跟着重渲染
provide(
  collapseKey,
  computed<CollapseContextValue>(() => ({
    active: collapseActiveNames(model.value),
    divider,
    disabled,
    toggle,
  })),
);
</script>

<template>
  <div :class="collapseClasses({ disabled })">
    <slot />
  </div>
</template>
