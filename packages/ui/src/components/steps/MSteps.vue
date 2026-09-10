<script setup lang="ts">
import "./steps.css";
import { computed, provide, ref, toRef } from "vue";
import { stepsKey } from "./context";
import type { StepsProps, StepsSlots } from "./types";

defineOptions({ name: "MSteps" });

const {
  active = 0,
  direction = "horizontal",
  status = "process",
  simple = false,
} = defineProps<StepsProps>();
defineSlots<StepsSlots>();

// 各步在 setup 里按出现顺序登记，序号就是它在这个数组里的位置；卸载时注销，后面的步自动前移
const ids = ref<string[]>([]);

function register(id: string) {
  ids.value.push(id);
  return () => {
    const i = ids.value.indexOf(id);
    if (i >= 0) ids.value.splice(i, 1);
  };
}

provide(stepsKey, {
  register,
  indexOf: (id) => ids.value.indexOf(id),
  count: computed(() => ids.value.length),
  active: toRef(() => active),
  status: toRef(() => status),
  direction: toRef(() => direction),
  simple: toRef(() => simple),
});
</script>

<template>
  <div
    class="m-steps"
    :class="[`m-steps--${direction}`, { 'm-steps--simple': simple }]"
    role="list"
  >
    <slot />
  </div>
</template>
