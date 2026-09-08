<script setup lang="ts">
import { ref } from "vue";
import { MBorder, MButton, MRicePaper, type RicePaperReadyPayload } from "@shuimo-design/ui";

const count = ref(0);
const dark = ref(false);
const seed = ref(42);
const info = ref<RicePaperReadyPayload>();

function toggleDark() {
  dark.value = !dark.value;
  document.documentElement.dataset.theme = dark.value ? "dark" : "light";
}
</script>

<template>
  <MRicePaper :seed="seed" style="min-height: 100vh" @ready="info = $event">
    <main style="padding: 24px; display: grid; gap: 24px; max-width: 960px">
      <section style="display: flex; gap: 12px; flex-wrap: wrap">
        <MButton @click="count++">落墨 {{ count }}</MButton>
        <MButton type="primary">主要</MButton>
        <MButton type="text">文字</MButton>
        <MButton disabled>禁用</MButton>
        <MButton href="https://shuimo.design">链接</MButton>
        <MButton @click="toggleDark">{{ dark ? "转亮" : "转暗" }}</MButton>
        <MButton @click="seed++">换一张山水</MButton>
      </section>
      <MBorder :seed="seed">
        <p style="margin: 0">
          笔触边框 MBorder：四边各一笔 naturalBrushStroke，按元素尺寸生成，8px 分桶缓存。
          拖动窗口宽度可以看到它重新落笔。
        </p>
      </MBorder>
      <MBorder :seed="seed + 1" :stroke-width="6" :roughness="0.8" :flying-white="0.5">
        <p style="margin: 0">粗笔、重飞白。</p>
      </MBorder>
      <p v-if="info">
        seed {{ info.seed }} · tier {{ info.tier }} · {{ info.polylines }} polylines ·
        {{ info.ms }} ms
      </p>
    </main>
  </MRicePaper>
</template>
