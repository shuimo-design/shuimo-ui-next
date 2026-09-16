<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { MBackTop, MButton } from "@shuimo-design/vue";

const clicks = ref(0);
const lines = Array.from({ length: 60 }, (_, i) => `第 ${i + 1} 行 —— 江湖的业务千篇一律。`);

// target 传函数：按钮挂载时盒子已经在了，函数返回的就是它
const box = useTemplateRef<HTMLElement>("box");
const boxTarget = () => box.value!;
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        盯着文档站的正文区（target=".pg__main"）：往下滚过 200px，右下角出现一枚「顶」字印
      </p>
      <p class="demo__hint">点击次数 {{ clicks }}；按钮传送到 body，位置由 right / bottom 定</p>
      <MBackTop target=".pg__main" @click="clicks++" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        盯着一个滚动盒子（target 传函数）；默认插槽换掉印，right 挪开免得和上面那枚重叠
      </p>
      <div ref="box" class="back-top-demo__box">
        <p v-for="line in lines" :key="line">{{ line }}</p>
      </div>
      <MBackTop :target="boxTarget" :visibility-height="100" :right="100" :bottom="40">
        <MButton type="primary">回到顶部</MButton>
      </MBackTop>
    </div>
  </div>
</template>

<style scoped>
.back-top-demo__box {
  width: 480px;
  max-width: 100%;
  height: 200px;
  padding: 0 12px;
  border: 1px solid var(--m-border);
  overflow: auto;
}
.back-top-demo__box p {
  margin: 8px 0;
}
</style>
