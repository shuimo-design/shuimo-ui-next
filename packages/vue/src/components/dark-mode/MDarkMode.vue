<script setup lang="ts">
import { computed, onMounted, useId, watch } from "vue";
import {
  createDarkMode,
  darkModeClasses,
  darkModeFish,
  darkModeGlowId,
  darkModeLabel,
  darkModePathVars,
  DARK_MODE_STORAGE_KEY,
  type DarkModeEmits,
  type DarkModeProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

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
/** 是否深色；undefined 表示还没选过（autoMode 下跟随系统） */
const model = defineModel<boolean | undefined>({ default: undefined });

// 读 localStorage、问 matchMedia、监听系统偏好、改 html[data-theme]、整页墨迹擦过
// 全在 core 的控制器里，和 React 那边是同一份
const { controller, state } = useController(createDarkMode, () => ({
  storageKey,
  autoMode,
  transition,
  value: model.value,
}));
const isDark = computed(() => state.value.isDark);

// 同页多个实例时 SVG 滤镜 id 不能撞
const glowId = darkModeGlowId(useId());
const fish = computed(() => darkModeFish(isDark.value, glowId));
const pathVars = darkModePathVars();

// connect() 已经在 useController 的 onMounted 里跑完，这时 state 是真实主题：
// 使用方绑了 v-model 但没给初值时，把推出来的结果补回去
onMounted(() => {
  if (model.value !== isDark.value) model.value = isDark.value;
});

// 外部改 v-model → 落到 html；系统偏好变了 → 回写 v-model
watch(model, (value) => {
  if (value !== undefined && value !== isDark.value) void controller.set(value);
});
watch(isDark, (value) => {
  model.value = value;
});

async function onClick() {
  if (disabled) return;
  await controller.toggle();
  emit("change", isDark.value);
}
</script>

<template>
  <button
    type="button"
    :class="darkModeClasses({ isDark, rotate, disabled })"
    :style="pathVars"
    role="switch"
    :aria-checked="isDark"
    :aria-label="darkModeLabel(isDark)"
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
      <path class="m-dark-mode__yin" :d="fish.yin.d" :filter="fish.yin.filter" />
      <!-- 白鱼：转 180° 与墨鱼咬合，姿势和墨鱼相反 -->
      <path
        class="m-dark-mode__yang"
        transform="rotate(180 250 250)"
        :d="fish.yang.d"
        :filter="fish.yang.filter"
      />
      <path class="m-dark-mode__fins" :d="fish.fins.d" />
      <circle class="m-dark-mode__eye m-dark-mode__eye--yin" cx="250" cy="375" r="40" />
      <circle class="m-dark-mode__eye m-dark-mode__eye--yang" cx="250" cy="125" r="40" />
    </svg>
  </button>
</template>
