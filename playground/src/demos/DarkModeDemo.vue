<script setup lang="ts">
import { ref } from "vue";
import { MDarkMode } from "@shuimo-design/ui";

const dark = ref<boolean>();
const changes = ref(0);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        点太极切换深浅；选择记在 localStorage（键 shuimo-theme），刷新后还在
      </p>
      <div class="demo__row">
        <MDarkMode v-model="dark" @change="changes++" />
        <span class="demo__hint">dark = {{ dark }}，切换了 {{ changes }} 次</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">不自转 / 不做整页墨迹转场 / 禁用</p>
      <div class="demo__row">
        <MDarkMode :rotate="false" />
        <MDarkMode :transition="false" />
        <MDarkMode disabled />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">尺寸和黑白两色都是组件变量，可以覆盖</p>
      <div class="demo__row">
        <MDarkMode style="--m-dark-mode-size: 48px" />
        <MDarkMode style="--m-dark-mode-size: 64px; --m-dark-mode-yin: #861717" />
        <MDarkMode style="--m-dark-mode-size: 20px" :rotate="false" />
      </div>
    </div>

    <p class="demo__hint">
      多个实例改的是同一个 html[data-theme]，点任何一个都会一起变；没有 v-model
      也没有本地记录时不动主题（默认亮色）， 传 auto-mode 才写 data-theme="system" 跟随系统。
    </p>
  </div>
</template>
