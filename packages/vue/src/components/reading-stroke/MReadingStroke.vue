<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import {
  createReadingStroke,
  READING_STROKE_SEED,
  READING_STROKE_THICKNESS,
  readingStrokeAria,
  readingStrokeClasses,
  readingStrokeStyle,
  type ReadingStrokeEmits,
  type ReadingStrokeProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MReadingStroke" });

const {
  seed = READING_STROKE_SEED,
  position = "top",
  target,
  thickness = READING_STROKE_THICKNESS,
  color,
  zIndex,
} = defineProps<ReadingStrokeProps>();
const emit = defineEmits<ReadingStrokeEmits>();

const root = useTemplateRef<HTMLElement>("root");

// 目标解析、滚动监听、进度换算、量视口宽度全在 core 的控制器里，React 那边用的是同一份
const { controller, state } = useController(createReadingStroke, () => ({
  target,
  onChange: (progress) => emit("change", progress),
}));

const classes = computed(() =>
  readingStrokeClasses({
    position,
    masked: state.value.width > 0,
    progress: state.value.progress,
  }),
);
const style = computed(() =>
  readingStrokeStyle({
    seed,
    thickness,
    width: state.value.width,
    color,
    zIndex,
    progress: state.value.progress,
  }),
);
const aria = computed(() => readingStrokeAria(state.value.progress));

onMounted(() => controller.attach(root.value));
</script>

<template>
  <div ref="root" :class="classes" :style="style" v-bind="aria">
    <div class="m-reading-stroke__bar" />
  </div>
</template>
