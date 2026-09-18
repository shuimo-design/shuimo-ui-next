<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { MButton, MReadingStroke } from "@shuimo-design/vue";

const percent = ref(0);
const seed = ref(1);
const lines = Array.from({ length: 80 }, (_, i) => `第 ${i + 1} 行 —— 一笔书，写到哪算哪。`);

// target 传函数：笔触挂载时盒子已经在了，函数返回的就是它
const box = useTemplateRef<HTMLElement>("box");
const boxTarget = () => box.value;
const boxPercent = ref(0);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        盯着文档站的正文区（target=".pg__main"）：视口顶部那根笔随着往下滚一路写过去，笔尖那一头化开
      </p>
      <p class="demo__hint">
        进度 {{ percent }}%（change 只在跨过整数百分点时触发）。 role="progressbar"，aria-valuenow
        是整数百分点
      </p>
      <div class="demo__row">
        <MButton @click="seed++">换一根笔（seed {{ seed }}）</MButton>
      </div>
      <MReadingStroke
        target=".pg__main"
        :seed="seed"
        @change="percent = Math.round($event * 100)"
      />
    </div>

    <div class="demo__block">
      <p class="demo__caption">盯着一个滚动盒子（target 传函数）；贴在视口底部，朱砂色、笔宽 6</p>
      <p class="demo__hint">盒子进度 {{ boxPercent }}%</p>
      <div ref="box" class="reading-stroke-demo__box">
        <p v-for="line in lines" :key="line">{{ line }}</p>
      </div>
      <MReadingStroke
        :target="boxTarget"
        position="bottom"
        :thickness="6"
        color="var(--m-seal)"
        @change="boxPercent = Math.round($event * 100)"
      />
    </div>
  </div>
</template>

<style scoped>
.reading-stroke-demo__box {
  width: 480px;
  max-width: 100%;
  height: 200px;
  padding: 0 12px;
  border: 1px solid var(--m-border);
  overflow: auto;
}
.reading-stroke-demo__box p {
  margin: 8px 0;
}
</style>
