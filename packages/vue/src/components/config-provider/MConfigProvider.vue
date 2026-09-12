<script setup lang="ts">
import { computed, onMounted, provide, watch } from "vue";
import {
  applyConfigTheme,
  mergeConfig,
  DEFAULT_CONFIG,
  type ConfigProviderProps,
} from "@shuimo-design/core";
import type { ConfigProviderSlots } from "@shuimo-design/core";
import { MOverlayOutlet } from "../overlay-outlet";
import { configKey, useConfig } from "./context";

defineOptions({ name: "MConfigProvider" });

// 不给默认值：没传的字段要继承外层 provider，给了默认值就分不清"没传"和"传了默认"
const { size, locale, inkTier, theme } = defineProps<ConfigProviderProps>();
defineSlots<ConfigProviderSlots>();

const parent = useConfig();
// 合并规则（只挑传了的字段盖到外层上）在 core，两个壳共用同一份
const config = computed(() => mergeConfig(parent.value, { size, locale, inkTier, theme }));
provide(configKey, config);

// 最外层的 provider 自带函数式弹层的渲染出口（MMessage.success / MConfirm.show 要它才弹得出来）。
// 只有最外层出：嵌套的 provider 再出一个，同一条消息就会渲染两遍。
// mergeConfig 每次都返回新对象，所以"父配置就是那份恒定的默认值"正好等价于"上面没有 provider"
const root = computed(() => parent.value === DEFAULT_CONFIG);

// 主题写到 html[data-theme] 上。碰 document 的那一步在 core 里（壳里不许出现 document.），
// 它自己会挡掉服务端；这里只负责"挂载后、theme 变了就再写一次"
onMounted(() => {
  watch(
    () => theme,
    (value) => applyConfigTheme(value),
    { immediate: true },
  );
});
</script>

<template>
  <slot />
  <MOverlayOutlet v-if="root" />
</template>
