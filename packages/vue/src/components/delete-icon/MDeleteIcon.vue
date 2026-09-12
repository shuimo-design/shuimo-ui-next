<script setup lang="ts">
import { computed } from "vue";
import {
  deleteIconClasses,
  deleteIconInert,
  deleteIconStyle,
  DELETE_ICON_BRUSH_SHAPES,
  DELETE_ICON_BRUSH_TRANSFORM,
  DELETE_ICON_BRUSH_VIEW_BOX,
  DELETE_ICON_LABEL,
  type DeleteIconEmits,
  type DeleteIconProps,
} from "@shuimo-design/core";

defineOptions({ name: "MDeleteIcon" });

const {
  kind = "brush",
  size = 32,
  disabled = false,
  label = DELETE_ICON_LABEL,
  seed = 1,
} = defineProps<DeleteIconProps>();
const emit = defineEmits<DeleteIconEmits>();

const style = computed(() => deleteIconStyle({ kind, size, seed }));

function onClick(event: MouseEvent) {
  if (deleteIconInert({ disabled })) return;
  emit("click", event);
}
</script>

<template>
  <button
    type="button"
    :class="deleteIconClasses({ kind, disabled })"
    :style="style"
    :aria-label="label"
    :disabled="disabled"
    @click="onClick"
  >
    <!-- 笔的几何在 core，这里只把它画出来；转角和画幅也一起从那边来 -->
    <svg
      v-if="kind === 'brush'"
      class="m-delete-icon__brush"
      :viewBox="DELETE_ICON_BRUSH_VIEW_BOX"
      aria-hidden="true"
    >
      <g :transform="DELETE_ICON_BRUSH_TRANSFORM" fill="currentColor">
        <component
          :is="shape.tag"
          v-for="(shape, i) in DELETE_ICON_BRUSH_SHAPES"
          :key="i"
          v-bind="shape.attrs"
        />
      </g>
    </svg>
    <span v-else class="m-delete-icon__cross" aria-hidden="true" />
  </button>
</template>
