<script setup lang="ts">
import { watch } from "vue";
import {
  createTypewriter,
  printerClasses,
  type PrinterEmits,
  type PrinterProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MPrinter" });

const {
  text = "",
  speed,
  pause,
  // 这三个必须直接从 defineProps() 上解构并写默认值：类型是 boolean，
  // Vue 会做 Boolean 转型，不写 default 的话"不传"会变成 false
  loop = false,
  cursor = true,
  autoplay = true,
} = defineProps<PrinterProps>();
const emit = defineEmits<PrinterEmits>();

// 定时器、码点切分、循环、结束回调全在 core 的控制器里，这里只负责喂参数和拿快照
const { controller, state } = useController(createTypewriter, () => ({
  text,
  speed,
  loop,
  pause,
  autoplay,
  onEnd: () => emit("end"),
}));

// 印文换了就从头再打；换没换由控制器自己比，这里只管在 DOM 更新之后提醒它一声
watch(
  () => text,
  () => controller.refresh(),
  { flush: "post" },
);

defineExpose({
  restart: () => controller.restart(),
  finish: () => controller.finish(),
});
</script>

<template>
  <span :class="printerClasses(state.done)" :aria-label="text">
    <span class="m-printer__text" aria-hidden="true">{{ state.shown }}</span>
    <span v-if="cursor" class="m-printer__cursor" aria-hidden="true" />
  </span>
</template>
