<script setup lang="ts">
import "./dark-mode.css";
import { onMounted, useId, watch } from "vue";
import { TAIJI_FINS_DARK, TAIJI_FINS_LIGHT, TAIJI_FISH, TAIJI_HIDDEN } from "./paths";
import type { DarkModeEmits, DarkModeProps } from "./types";
import { DARK_MODE_STORAGE_KEY, useDarkMode } from "./use-dark-mode";

defineOptions({ name: "MDarkMode" });

const {
  disabled = false,
  autoMode = false,
  rotate = true,
  storageKey = DARK_MODE_STORAGE_KEY,
  transition = true,
} = defineProps<DarkModeProps>();
const emit = defineEmits<DarkModeEmits>();
// 显式 default: undefined 是为了绕开 Boolean 转型（不传会变 false）：
// undefined 表示使用方没绑 v-model，初始状态要从本地记录 / 系统偏好推
const model = defineModel<boolean | undefined>({ default: undefined });

const { isDark, init, set, toggle } = useDarkMode({
  storageKey: () => storageKey,
  autoMode: () => autoMode,
  transition: () => transition,
});
// 同页多个实例时 SVG 滤镜 id 不能撞
const glowId = `${useId()}-glow`;

// 路径同时给 d 属性（Safari 兜底）和 CSS 变量（Chromium / Firefox 用 transition 对 d 插值）
const pathVars = {
  "--m-dark-mode-path-hidden": `path("${TAIJI_HIDDEN}")`,
  "--m-dark-mode-path-fish": `path("${TAIJI_FISH}")`,
  "--m-dark-mode-path-fins-light": `path("${TAIJI_FINS_LIGHT}")`,
  "--m-dark-mode-path-fins-dark": `path("${TAIJI_FINS_DARK}")`,
};

onMounted(() => {
  init(model.value);
  if (model.value !== isDark.value) model.value = isDark.value;
});

// 外部改 v-model → 落到 html；系统偏好变了 → 回写 v-model
watch(model, (value) => {
  if (value !== undefined && value !== isDark.value) void set(value);
});
watch(isDark, (value) => {
  model.value = value;
});

async function onClick() {
  if (disabled) return;
  await toggle();
  emit("change", isDark.value);
}
</script>

<template>
  <button
    type="button"
    class="m-dark-mode"
    :class="{
      'm-dark-mode--dark': isDark,
      'm-dark-mode--rotate': rotate,
      'm-dark-mode--disabled': disabled,
    }"
    :style="pathVars"
    role="switch"
    :aria-checked="isDark"
    :aria-label="isDark ? '切换到亮色' : '切换到深色'"
    :disabled="disabled"
    @click="onClick"
  >
    <svg class="m-dark-mode__svg" viewBox="-10 -10 520 520" aria-hidden="true">
      <defs>
        <filter :id="glowId" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow class="m-dark-mode__glow" dx="0" dy="0" stdDeviation="20" />
        </filter>
      </defs>
      <!-- 墨鱼：亮色收着，转暗摆尾 -->
      <path
        class="m-dark-mode__yin"
        :d="isDark ? TAIJI_FISH : TAIJI_HIDDEN"
        :filter="isDark ? `url(#${glowId})` : undefined"
      />
      <!-- 白鱼：转 180° 与墨鱼咬合，姿势和墨鱼相反 -->
      <path
        class="m-dark-mode__yang"
        transform="rotate(180 250 250)"
        :d="isDark ? TAIJI_HIDDEN : TAIJI_FISH"
        :filter="isDark ? undefined : `url(#${glowId})`"
      />
      <path class="m-dark-mode__fins" :d="isDark ? TAIJI_FINS_DARK : TAIJI_FINS_LIGHT" />
      <circle class="m-dark-mode__eye m-dark-mode__eye--yin" cx="250" cy="375" r="40" />
      <circle class="m-dark-mode__eye m-dark-mode__eye--yang" cx="250" cy="125" r="40" />
    </svg>
  </button>
</template>
