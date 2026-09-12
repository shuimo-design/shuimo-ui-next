<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import {
  progressBarStyle,
  progressBrush,
  progressClasses,
  progressShowInfo,
  progressValue,
  progressVars,
  type ProgressProps,
  type ProgressSlots,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";

defineOptions({ name: "MProgress" });

const {
  value,
  max,
  status,
  strokeWidth,
  // Vue 会把"没传的布尔 prop"转成 false，只有写成解构默认值才会登记进 props 的 default。
  // showInfo 的默认是 true，不在这里登记的话 core 分不清"没传"和"显式传了 false"
  showInfo = true,
} = defineProps<ProgressProps>();
defineSlots<ProgressSlots>();

const track = useTemplateRef<HTMLElement>("track");
useBrushBorder(track, progressBrush());

// core 的函数收整份 props，这里把解构出来的值重新组一份给它们（解构后仍是响应式的）
const props = computed<ProgressProps>(() => ({ value, max, status, strokeWidth, showInfo }));
// 钳制、取整全在 core，这里只把结果绑上去
const state = computed(() => progressValue(props.value));
</script>

<template>
  <div
    :class="progressClasses(props, state.percent)"
    :style="progressVars(props)"
    role="progressbar"
    :aria-valuenow="state.clamped"
    aria-valuemin="0"
    :aria-valuemax="state.max"
    :aria-valuetext="`${state.percent}%`"
  >
    <div ref="track" class="m-progress__track">
      <div class="m-progress__bar" :style="progressBarStyle(state.percent)" />
    </div>
    <!-- 文字压在条上居中：纸色字描一圈墨边，条走到字下面也看得清 -->
    <div v-if="progressShowInfo(props)" class="m-progress__info">
      <slot :percent="state.percent">{{ state.percent }}%</slot>
    </div>
  </div>
</template>
