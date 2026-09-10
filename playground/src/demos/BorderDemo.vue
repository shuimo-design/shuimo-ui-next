<script setup lang="ts">
import { ref } from "vue";
import { MBorder, MButton } from "@shuimo-design/ui";

const seed = ref(1);
</script>

<template>
  <div class="demo">
    <div class="demo__row">
      <MButton @click="seed++">换一笔（seed {{ seed }}）</MButton>
    </div>

    <div class="demo__block">
      <p class="demo__caption">普通边框：内容贴边，笔触压在内容边缘上（旧站示例）</p>
      <div class="demo__row">
        <MBorder :seed="seed"><div class="border-demo__red" /></MBorder>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        部分显示：<code>:top="false" :right="false"</code>，或
        <code>:border="{ top: false }"</code>， 或 <code>:border="false" left</code> 只留一边
      </p>
      <div class="demo__row">
        <MBorder :seed="seed" :top="false" :right="false"><div class="border-demo__red" /></MBorder>
        <MBorder :seed="seed" :border="{ top: false, bottom: false }">
          <div class="border-demo__red" />
        </MBorder>
        <MBorder :seed="seed" :border="false" left><div class="border-demo__red" /></MBorder>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        蒙层与内边距：<code>mask</code> 给一层半透明纸色加背景模糊，<code>padding</code> 留白
      </p>
      <MBorder :seed="seed" mask :padding="16">
        <p style="margin: 0">
          MBorder：四边各一笔变宽墨带加飞白，纯 SVG 生成，按元素尺寸 8px 分桶缓存。
          拖动窗口宽度可以看到它重新落笔。
        </p>
      </MBorder>
    </div>

    <div class="demo__block">
      <p class="demo__caption">笔宽、飞白、墨色</p>
      <MBorder
        :seed="seed + 1"
        :stroke-width="6"
        :roughness="0.8"
        :flying-white="0.5"
        :padding="12"
      >
        <p style="margin: 0">粗笔、重飞白。</p>
      </MBorder>
      <MBorder
        :seed="seed + 2"
        :stroke-width="1.5"
        :roughness="0.2"
        :flying-white="0"
        :padding="12"
      >
        <p style="margin: 0">细笔、匀墨。</p>
      </MBorder>
      <MBorder :seed="seed + 3" color="var(--m-accent)" :padding="12">
        <p style="margin: 0">朱砂：<code>color="var(--m-accent)"</code></p>
      </MBorder>
    </div>
  </div>
</template>

<style scoped>
.border-demo__red {
  width: 200px;
  height: 100px;
  background: var(--m-danger);
}
</style>
