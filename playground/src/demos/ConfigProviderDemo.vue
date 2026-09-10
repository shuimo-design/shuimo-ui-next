<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import { MButton, MConfigProvider, useConfig, type ConfigSize } from "@shuimo-design/ui";

// 一个只负责把 useConfig() 读到的值打出来的小组件，模拟"别的组件读全局配置"
const ConfigProbe = defineComponent({
  name: "ConfigProbe",
  setup() {
    const config = useConfig();
    return () =>
      h(
        "code",
        `size=${config.value.size} · locale=${config.value.locale} · inkTier=${config.value.inkTier ?? "auto"}`,
      );
  },
});

const SIZES: ConfigSize[] = ["sm", "md", "lg"];
const size = ref<ConfigSize>("md");
const locale = ref("zh-CN");

function nextSize() {
  size.value = SIZES[(SIZES.indexOf(size.value) + 1) % SIZES.length]!;
}
function toggleLocale() {
  locale.value = locale.value === "zh-CN" ? "en-US" : "zh-CN";
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">没有 provider：拿到默认值</p>
      <ConfigProbe />
    </div>

    <div class="demo__block">
      <p class="demo__caption">外层 provider 的值会传给所有后代</p>
      <div class="demo__row">
        <MButton @click="nextSize">size → {{ size }}</MButton>
        <MButton @click="toggleLocale">locale → {{ locale }}</MButton>
      </div>
      <MConfigProvider :size="size" :locale="locale" :ink-tier="2">
        <ConfigProbe />
      </MConfigProvider>
    </div>

    <div class="demo__block">
      <p class="demo__caption">嵌套：内层只改自己传了的字段，其余继承外层</p>
      <MConfigProvider :size="size" :locale="locale">
        <MConfigProvider size="sm">
          <ConfigProbe />
        </MConfigProvider>
      </MConfigProvider>
    </div>

    <p class="demo__hint">
      theme 属性会写到 html 的 data-theme（light / dark / system），和左下角的转暗按钮、MDarkMode
      作用的是同一个属性，这里不演示以免互相覆盖。
    </p>
  </div>
</template>
