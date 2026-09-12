<script setup lang="ts">
import { computed, Transition } from "vue";
import {
  inkTransitionHooks,
  type InkTransitionProps,
  type InkTransitionSlots,
} from "@shuimo-design/core";
import { toVueTransitionHooks } from "../../runtime/transition-hooks";

defineOptions({ name: "MInkTransition" });

// 必须直接解构 defineProps：先存成变量再解构，编译出来是 setup 期的一次性快照，props 改了不会重渲染。
// duration / leaveDuration / direction 这些的默认值在 core 的 inkTransitionHooks 里，这里不重复写
const {
  duration,
  leaveDuration,
  appear = false,
  mode = "default",
  seed,
  direction,
  raggedness,
  softness,
  reducedMotion,
} = defineProps<InkTransitionProps>();
defineSlots<InkTransitionSlots>();

// 落墨和擦除这两个钩子在 core 里，React 那边用的是同一份
const hooks = computed(() =>
  toVueTransitionHooks(
    inkTransitionHooks({
      duration,
      leaveDuration,
      seed,
      direction,
      raggedness,
      softness,
      reducedMotion,
    }),
  ),
);
</script>

<template>
  <!-- css: false —— 一个类名都不加，进出场完全由 JS 钩子里的 Web Animations 说了算 -->
  <Transition
    :css="false"
    :appear="appear"
    :mode="mode === 'default' ? undefined : mode"
    v-bind="hooks"
  >
    <slot />
  </Transition>
</template>
