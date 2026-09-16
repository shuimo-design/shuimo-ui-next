<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watch } from "vue";
import {
  createPaperTheme,
  focusedPaperSwatchIndex,
  focusPaperSwatch,
  paperThemeClasses,
  paperThemeNextIndex,
  paperThemePresets,
  paperThemeSwatches,
  type PaperPreset,
  type PaperThemeEmits,
  type PaperThemeProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MPaperTheme" });

const {
  presets,
  size = "md",
  storage = true,
  labels,
  disabled = false,
} = defineProps<PaperThemeProps>();
const emit = defineEmits<PaperThemeEmits>();
// 显式 default: undefined：undefined 表示使用方没绑 v-model:preset，初始状态要从本地记录 / 页面现状推
/** 当前用的纸；undefined 表示还没切过（tokens.css 的默认纸） */
const preset = defineModel<PaperPreset | undefined>("preset", { default: undefined });

// 读 localStorage、改 html[data-paper] 和纸面变量、盯 data-theme 和系统偏好
// 全在 core 的控制器里，和 React 那边是同一份
const { controller, state } = useController(createPaperTheme, () => ({
  storage,
  value: preset.value,
}));
const current = computed(() => state.value.preset);

const list = computed(() => paperThemePresets(presets));
const swatches = computed(() =>
  paperThemeSwatches({ presets: list.value, labels, preset: current.value }),
);
const rootClass = computed(() => paperThemeClasses({ size, disabled }));

// connect() 已经在 useController 的 onMounted 里跑完，这时 state 是真实的纸：
// 使用方绑了 v-model 但没给初值时，把推出来的结果补回去
onMounted(() => {
  if (preset.value !== current.value) preset.value = current.value;
});

// 外部改 v-model → 落到 html；别的实例 / applyPaperPreset 改了 html → 回写 v-model
watch(preset, (value) => {
  if (value !== undefined && value !== current.value) controller.set(value);
});
watch(current, (value) => {
  preset.value = value;
});

function select(next: PaperPreset) {
  if (disabled) return;
  const changed = next !== current.value;
  controller.set(next);
  if (changed) emit("change", next);
}

const root = useTemplateRef<HTMLElement>("root");

// roving tabindex：方向键在纸样间循环并直接选中，Home / End 跳到两头
function onKeydown(event: KeyboardEvent) {
  if (disabled) return;
  const focused = focusedPaperSwatchIndex(root.value, event.target);
  const from = focused >= 0 ? focused : swatches.value.findIndex((s) => s.checked);
  const next = paperThemeNextIndex(swatches.value.length, { key: event.key, from });
  if (next === undefined) return;
  event.preventDefault();
  focusPaperSwatch(root.value, next);
  const swatch = swatches.value[next];
  if (swatch) select(swatch.preset);
}
</script>

<template>
  <div ref="root" :class="rootClass" role="radiogroup" @keydown="onKeydown">
    <button
      v-for="swatch in swatches"
      :key="swatch.preset"
      type="button"
      :class="swatch.className"
      :style="swatch.style"
      role="radio"
      :aria-checked="swatch.checked"
      :tabindex="disabled ? -1 : swatch.tabIndex"
      :disabled="disabled"
      @click="select(swatch.preset)"
    >
      <span class="m-paper-theme__paper" aria-hidden="true" />
      <span class="m-paper-theme__label">{{ swatch.label }}</span>
    </button>
  </div>
</template>
