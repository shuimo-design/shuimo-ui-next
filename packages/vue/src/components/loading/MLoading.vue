<script setup lang="ts">
import { computed } from "vue";
import {
  loadingClasses,
  loadingDots,
  loadingLabel,
  loadingVars,
  LOADING_VIEW_BOX,
  type LoadingProps,
  type LoadingSlots,
} from "@shuimo-design/core";

defineOptions({ name: "MLoading" });

const props = defineProps<LoadingProps>();
const slots = defineSlots<LoadingSlots>();

// 墨点坐标是纯计算，放在 core；seed 不变时不用重算
const dots = computed(() => loadingDots(props));
const hasText = computed(() => Boolean(slots.default || props.text));
</script>

<template>
  <div
    :class="loadingClasses(props)"
    :style="loadingVars(props)"
    role="status"
    aria-live="polite"
    :aria-label="loadingLabel(props)"
  >
    <div class="m-loading__indicator">
      <slot name="indicator">
        <svg class="m-loading__spinner" :viewBox="LOADING_VIEW_BOX" aria-hidden="true">
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
      <slot>{{ props.text }}</slot>
    </div>
  </div>
</template>
