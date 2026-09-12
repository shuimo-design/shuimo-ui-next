<script setup lang="ts">
import { computed, onMounted, provide, watch } from "vue";
import { configKey, useConfig, type ConfigContext } from "./context";
import type { ConfigProviderProps, ConfigProviderSlots } from "./types";

defineOptions({ name: "MConfigProvider" });

// 不给默认值：没传的字段要继承外层 provider，给了默认值就分不清"没传"和"传了默认"
const { size, locale, inkTier, theme } = defineProps<ConfigProviderProps>();
defineSlots<ConfigProviderSlots>();

const parent = useConfig();
const config = computed<ConfigContext>(() => ({
  ...parent.value,
  ...(size !== undefined ? { size } : {}),
  ...(locale !== undefined ? { locale } : {}),
  ...(inkTier !== undefined ? { inkTier } : {}),
  ...(theme !== undefined ? { theme } : {}),
}));
provide(configKey, config);

// 主题落到 html[data-theme] 上（tokens.css 只认这个属性）。只在浏览器里、挂载后写，
// 避免 SSR 阶段碰 document；不传 theme 就完全不碰，留给 MDarkMode 或使用方
onMounted(() => {
  watch(
    () => theme,
    (value) => {
      if (value !== undefined) document.documentElement.dataset.theme = value;
    },
    { immediate: true },
  );
});
</script>

<template>
  <slot />
</template>
