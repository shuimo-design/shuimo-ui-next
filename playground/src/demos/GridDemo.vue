<script setup lang="ts">
import { ref } from "vue";
import { MButton, MCell, MGrid } from "@shuimo-design/ui";

const tilt = ref(15);
const poems = ["春江潮水连海平", "海上明月共潮生", "滟滟随波千万里", "何处春江无月明"];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">横向排列，格子均分宽度，gap 控制间距</p>
      <MGrid :gap="16" :h="64">
        <MCell v-for="poem in poems" :key="poem" border>
          <div style="padding: 12px">{{ poem }}</div>
        </MCell>
      </MGrid>
    </div>

    <div class="demo__block">
      <p class="demo__caption">给了 w 的格子按宽来，其余均分剩下的</p>
      <MGrid :gap="12" :h="48">
        <MCell :w="120" border><div style="padding: 12px">120px</div></MCell>
        <MCell border><div style="padding: 12px">自适应</div></MCell>
        <MCell :w="200" border><div style="padding: 12px">200px</div></MCell>
      </MGrid>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        gapRotate：每道分隔一个倾斜角，相邻格子自动错位拼出斜缝（当前 {{ tilt }}°）
      </p>
      <MGrid :gap="10" :h="96" :gap-rotate="[tilt, -tilt, tilt]">
        <MCell v-for="poem in poems" :key="poem" border>
          <div style="padding: 24px 32px">{{ poem }}</div>
        </MCell>
      </MGrid>
      <div class="demo__row">
        <MButton @click="tilt = Math.max(0, tilt - 5)">-5°</MButton>
        <MButton @click="tilt = Math.min(40, tilt + 5)">+5°</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">单个格子的四边：points 简写（上 右 下 左）或 a / b / c / d 单独给</p>
      <div class="demo__row">
        <MCell :w="140" :h="90" border points="0 12">
          <div style="padding: 24px; text-align: center">points="0 12"</div>
        </MCell>
        <MCell :w="140" :h="90" border :a="8" :c="8">
          <div style="padding: 24px; text-align: center">a=8 c=8</div>
        </MCell>
        <MCell :w="140" :h="90" border :points="10">
          <div style="padding: 24px; text-align: center">points=10</div>
        </MCell>
        <MCell :w="140" :h="90" border :b="-20" :d="-20">
          <div style="padding: 24px; text-align: center">b=-20 d=-20</div>
        </MCell>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">纵向排列</p>
      <MGrid direction="column" :gap="8" :h="36" style="width: 240px">
        <MCell v-for="poem in poems.slice(0, 3)" :key="poem" border>
          <div style="padding: 6px 12px">{{ poem }}</div>
        </MCell>
      </MGrid>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        cols 等宽网格：span 跨列、offset 留空；cols 也可以按断点给 { xs: 2, md: 4, lg: 6 }
      </p>
      <MGrid :cols="{ xs: 2, md: 4, lg: 6 }" :gap="12" :row-gap="8" :h="40">
        <MCell border :span="2"><div style="padding: 10px">span 2</div></MCell>
        <MCell border><div style="padding: 10px">1</div></MCell>
        <MCell border><div style="padding: 10px">1</div></MCell>
        <MCell border :offset="1" :span="2">
          <div style="padding: 10px">offset 1, span 2</div>
        </MCell>
        <MCell border><div style="padding: 10px">1</div></MCell>
        <MCell border><div style="padding: 10px">1</div></MCell>
      </MGrid>
      <p class="demo__hint">拖动窗口宽度看列数变化。</p>
    </div>
  </div>
</template>
