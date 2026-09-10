<script setup lang="ts">
import "./delete-icon.css";
import { computed } from "vue";
import { inkMarkUrl } from "../../ink/assets/mark";
import type { DeleteIconEmits, DeleteIconProps } from "./types";

defineOptions({ name: "MDeleteIcon" });

const {
  kind = "brush",
  size = 32,
  disabled = false,
  label = "删除",
  seed = 1,
} = defineProps<DeleteIconProps>();
const emit = defineEmits<DeleteIconEmits>();

// 叉用素材库那一笔；写成组件自己的变量而不用 --m-ink-mark-cross，没开 ink 引擎时也有图
const style = computed(() => ({
  "--m-delete-icon-size": `${size}px`,
  ...(kind === "cross"
    ? { "--m-delete-icon-cross": `url("${inkMarkUrl("cross", { seed, strokeWidth: 3 })}")` }
    : {}),
}));

function onClick(event: MouseEvent) {
  if (disabled) return;
  emit("click", event);
}
</script>

<template>
  <button
    type="button"
    class="m-delete-icon"
    :class="[`m-delete-icon--${kind}`, { 'm-delete-icon--disabled': disabled }]"
    :style="style"
    :aria-label="label"
    :disabled="disabled"
    @click="onClick"
  >
    <!-- 一支斜放的毛笔（笔尖朝左上）：先横着画，再整体转 45° -->
    <svg
      v-if="kind === 'brush'"
      class="m-delete-icon__brush"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <g transform="rotate(45 16 16)" fill="currentColor">
        <path d="M0.8 16 C3 13.8 6 12.2 9.2 11.9 L10.6 16 L9.2 20.1 C6 19.8 3 18.2 0.8 16 Z" />
        <rect x="10.2" y="12.3" width="2.6" height="7.4" rx="0.6" />
        <path d="M12.8 12.8 L27.4 13.8 L27.4 18.2 L12.8 19.2 Z" />
        <path
          class="m-delete-icon__gloss"
          d="M14.4 14.5 L26.2 15.2"
          fill="none"
          stroke-width="0.9"
          stroke-linecap="round"
        />
        <rect x="27.4" y="13.6" width="1.6" height="4.8" rx="0.5" />
        <circle cx="30.4" cy="16" r="1.5" fill="none" stroke="currentColor" stroke-width="1.2" />
      </g>
    </svg>
    <span v-else class="m-delete-icon__cross" aria-hidden="true" />
  </button>
</template>
