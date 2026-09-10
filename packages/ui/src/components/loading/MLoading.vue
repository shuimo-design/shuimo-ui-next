<script setup lang="ts">
import "./loading.css";
import { computed } from "vue";
import { blobPoints } from "../../ink/assets/brush";
import { createRng } from "../../ink/random";
import type { LoadingProps, LoadingSlots } from "./types";

defineOptions({ name: "MLoading" });

const { speed = 2000, size = 40, mask = false, text, seed = 1 } = defineProps<LoadingProps>();
const slots = defineSlots<LoadingSlots>();

const DOTS = 8;
// 一笔转圈：八团毛边墨点沿圆周排开，从笔尾到笔头越来越大、越来越浓，转起来像一笔拖出的墨尾
const dots = computed(() => {
  const rng = createRng(seed * 13 + 5);
  return Array.from({ length: DOTS }, (_, i) => {
    const t = i / (DOTS - 1);
    const angle = (i / DOTS) * Math.PI * 2;
    return {
      points: blobPoints(
        24 + Math.cos(angle) * 15,
        24 + Math.sin(angle) * 15,
        2 + 3 * t,
        rng,
        0.18,
        32,
      ),
      opacity: (0.3 + 0.7 * t).toFixed(2),
    };
  });
});
const hasText = computed(() => Boolean(slots.default || text));
</script>

<template>
  <div
    class="m-loading"
    :class="{ 'm-loading--mask': mask }"
    :style="{ '--m-loading-speed': `${speed}ms`, '--m-loading-size': `${size}px` }"
    role="status"
    aria-live="polite"
    :aria-label="text ?? '加载中'"
  >
    <div class="m-loading__indicator">
      <slot name="indicator">
        <svg class="m-loading__spinner" viewBox="0 0 48 48" aria-hidden="true">
          <polygon
            v-for="(dot, i) in dots"
            :key="i"
            :points="dot.points"
            :fill-opacity="dot.opacity"
          />
        </svg>
      </slot>
    </div>
    <div v-if="hasText" class="m-loading__text">
      <slot>{{ text }}</slot>
    </div>
  </div>
</template>
