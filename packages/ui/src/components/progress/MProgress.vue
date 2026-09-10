<script setup lang="ts">
import "./progress.css";
import { computed, useTemplateRef } from "vue";
import { useBrushBorder } from "../../ink/stroke";
import type { ProgressProps, ProgressSlots } from "./types";

defineOptions({ name: "MProgress" });

const {
  value = 0,
  max = 100,
  showInfo = true,
  status = "default",
  strokeWidth = 7,
} = defineProps<ProgressProps>();
defineSlots<ProgressSlots>();

const track = useTemplateRef<HTMLElement>("track");
// 外框是一圈细笔触（对应旧版 MBorder 的手绘框），进度条本体是框里一段实墨
useBrushBorder(track, { strokeWidth: 1.5, seed: 3 });

const clamped = computed(() => Math.min(Math.max(value, 0), Math.max(max, 0)));
// 最多两位小数；Number() 会把 33.30 这样的多余 0 去掉
const percent = computed(() => (max > 0 ? Number(((clamped.value / max) * 100).toFixed(2)) : 0));
</script>

<template>
  <div
    class="m-progress"
    :class="[`m-progress--${status}`, { 'm-progress--done': percent >= 100 }]"
    :style="{ '--m-progress-h': `${strokeWidth}px` }"
    role="progressbar"
    :aria-valuenow="clamped"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuetext="`${percent}%`"
  >
    <div ref="track" class="m-progress__track">
      <div class="m-progress__bar" :style="{ width: `${percent}%` }" />
    </div>
    <!-- 文字压在条上居中：纸色字描一圈墨边，条走到字下面也看得清 -->
    <div v-if="showInfo" class="m-progress__info">
      <slot :percent="percent">{{ percent }}%</slot>
    </div>
  </div>
</template>
