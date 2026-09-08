<script setup lang="ts">
import { ref } from "vue";
import {
  MBorder,
  MButton,
  MInkTransition,
  MRicePaper,
  vInkReveal,
  type RicePaperReadyPayload,
} from "@shuimo-design/ui";
import { startInkViewTransition } from "@shuimo-design/ui/ink";

const count = ref(0);
const dark = ref(false);
const seed = ref(42);
const info = ref<RicePaperReadyPayload>();
const showPanel = ref(true);
const revealKey = ref(0);

function toggleDark() {
  dark.value = !dark.value;
  document.documentElement.dataset.theme = dark.value ? "dark" : "light";
}

function nextSeedWithTransition() {
  void startInkViewTransition(() => {
    seed.value++;
  });
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
        <MButton @click="nextSeedWithTransition">整页墨迹转场换山水</MButton>
      </section>

      <MBorder :seed="seed">
        <p style="margin: 0">
          笔触边框 MBorder：四边各一笔 naturalBrushStroke，按元素尺寸生成，8px 分桶缓存，
          首次落笔沿笔顺描出。拖动窗口宽度可以看到它重新落笔（不再播放描出）。
        </p>
      </MBorder>
      <MBorder :seed="seed + 1" :stroke-width="6" :roughness="0.8" :flying-white="0.5">
        <p style="margin: 0">粗笔、重飞白。</p>
      </MBorder>

      <section style="display: grid; gap: 12px">
        <div style="display: flex; gap: 12px">
          <MButton @click="showPanel = !showPanel">{{
            showPanel ? "擦掉面板" : "擦入面板"
          }}</MButton>
          <MButton @click="revealKey++">重放段落落墨</MButton>
        </div>
        <MInkTransition direction="right" :seed="seed">
          <MBorder v-if="showPanel" :seed="seed + 2">
            <p style="margin: 0">MInkTransition：进入时从左向右墨迹擦入，离开时反向擦掉。</p>
          </MBorder>
        </MInkTransition>
        <p
          :key="revealKey"
          v-ink-reveal="{ direction: 'down', duration: 1200 }"
          style="margin: 0; font-size: 18px; line-height: 1.8"
        >
          v-ink-reveal：任意元素挂上指令，挂载时以毛边遮罩自上而下落墨显现。江流天地外，山色有无中。
        </p>
      </section>

      <p v-if="info">
        seed {{ info.seed }} · tier {{ info.tier }} · {{ info.polylines }} polylines ·
        {{ info.ms }} ms
      </p>
    </main>
  </MRicePaper>
</template>
