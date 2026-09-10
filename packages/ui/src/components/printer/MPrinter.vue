<script setup lang="ts">
import "./printer.css";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { PrinterEmits, PrinterProps } from "./types";

defineOptions({ name: "MPrinter" });

const {
  text = "",
  speed = 80,
  loop = false,
  pause = 1200,
  cursor = true,
  autoplay = true,
} = defineProps<PrinterProps>();
const emit = defineEmits<PrinterEmits>();

// 按码点切，emoji 之类的代理对不会被打成半个
const chars = computed(() => Array.from(text));
const count = ref(0);
const shown = computed(() => chars.value.slice(0, count.value).join(""));
const done = computed(() => count.value >= chars.value.length);
let timer: ReturnType<typeof setTimeout> | undefined;

function stop() {
  clearTimeout(timer);
  timer = undefined;
}

function tick() {
  timer = undefined;
  if (count.value < chars.value.length) count.value += 1;
  if (count.value < chars.value.length) {
    timer = setTimeout(tick, speed);
    return;
  }
  emit("end");
  if (loop && chars.value.length > 0) timer = setTimeout(restart, pause);
}

/** 从头再打一遍；speed 不为正数时直接整段显示 */
function restart() {
  stop();
  count.value = 0;
  if (chars.value.length === 0) return;
  if (speed <= 0) {
    finish();
    return;
  }
  timer = setTimeout(tick, speed);
}

/** 跳到结尾，直接显示全文 */
function finish() {
  stop();
  count.value = chars.value.length;
  emit("end");
}

watch(() => text, restart);
onMounted(() => {
  if (autoplay) restart();
});
onBeforeUnmount(stop);

defineExpose({ restart, finish });
</script>

<template>
  <span class="m-printer" :class="{ 'm-printer--done': done }" :aria-label="text">
    <span class="m-printer__text" aria-hidden="true">{{ shown }}</span>
    <span v-if="cursor" class="m-printer__cursor" aria-hidden="true" />
  </span>
</template>
