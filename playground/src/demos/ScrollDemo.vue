<script setup lang="ts">
import { ref } from "vue";
import { MButton, MScroll, type ScrollPosition } from "@shuimo-design/ui";

const position = ref<ScrollPosition>({ scrollTop: 0, scrollLeft: 0 });
const lines = Array.from(
  { length: 40 },
  (_, i) => `第 ${i + 1} 行 —— 江湖的业务千篇一律，复杂的代码好几百行。`,
);
const extra = ref(0);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">双向滚动：内容 800×800，视口 400×400（旧文档示例）</p>
      <MScroll class="scroll-demo__box" :height="400" @scroll="position = $event">
        <div class="scroll-demo__inside" />
      </MScroll>
      <p class="demo__hint">
        scrollTop {{ position.scrollTop }} · scrollLeft {{ position.scrollLeft }}
      </p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">只限高：文字列表，滚动条悬停时才浮现；内容变化后滑块自动重算</p>
      <MScroll class="scroll-demo__text" max-height="220px">
        <p v-for="line in lines" :key="line">{{ line }}</p>
        <p v-for="i in extra" :key="`extra-${i}`">追加的第 {{ i }} 行</p>
      </MScroll>
      <div class="demo__row">
        <MButton @click="extra += 10">追加 10 行</MButton>
        <MButton @click="extra = 0">清空追加</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">always：滚动条常驻</p>
      <MScroll class="scroll-demo__text" :height="120" always>
        <p v-for="line in lines.slice(0, 12)" :key="line">{{ line }}</p>
      </MScroll>
    </div>
  </div>
</template>

<style scoped>
.scroll-demo__box {
  width: 400px;
  border: 1px solid var(--m-border);
}
.scroll-demo__inside {
  width: 800px;
  height: 800px;
  background: linear-gradient(140deg, var(--m-success) 0%, var(--m-warn) 50%, var(--m-danger) 75%);
}
.scroll-demo__text {
  width: 480px;
  max-width: 100%;
  padding: 0 12px;
  border: 1px solid var(--m-border);
}
.scroll-demo__text p {
  margin: 8px 0;
  white-space: nowrap;
}
</style>
