<script setup lang="ts">
import { ref } from "vue";
import { clearPaperPreset, MButton, MPaperTheme, type PaperPreset } from "@shuimo-design/vue";

const preset = ref<PaperPreset>();
const changes = ref(0);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        点纸样切换整站的纸：html 上写 data-paper 和纸面变量（--m-paper-rgb / --m-paper /
        --m-bg），这个站的宣纸底、输入框底色都跟着变；选择记在 localStorage（键
        shuimo-paper），刷新后还在
      </p>
      <div class="demo__row">
        <MPaperTheme v-model:preset="preset" @change="changes++" />
        <span class="demo__hint">preset = {{ preset }}，切换了 {{ changes }} 次</span>
        <MButton @click="clearPaperPreset()">回到默认纸</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">三个尺寸</p>
      <div class="demo__row">
        <MPaperTheme size="sm" />
        <MPaperTheme />
        <MPaperTheme size="lg" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">只列一部分纸、改显示名；storage 关掉后不记录，刷新回到之前的选择</p>
      <div class="demo__row">
        <MPaperTheme :presets="['raw', 'antique', 'moonWhite']" :labels="{ antique: '绢本' }" />
        <MPaperTheme :presets="['raw', 'processed']" :storage="false" />
        <MPaperTheme disabled />
      </div>
    </div>

    <p class="demo__hint">
      多个实例改的是同一个 html[data-paper]，点任何一个都会一起变。深色主题下只记
      data-paper、不写纸面变量（深色纸由 tokens.css
      决定），转回亮色时再补上。方向键在纸样间切换，Home / End 跳到两头。不用组件也可以直接调
      applyPaperPreset("antique")。
    </p>
  </div>
</template>
