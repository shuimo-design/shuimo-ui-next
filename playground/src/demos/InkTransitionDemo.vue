<script setup lang="ts">
import { ref } from "vue";
import { MBorder, MButton, MInkTransition, vInkReveal } from "@shuimo-design/ui";

const showPanel = ref(true);
const revealKey = ref(0);
</script>

<template>
  <div class="demo">
    <div class="demo__row">
      <MButton @click="showPanel = !showPanel">{{ showPanel ? "擦掉面板" : "擦入面板" }}</MButton>
      <MButton @click="revealKey++">重放段落落墨</MButton>
    </div>
    <MInkTransition direction="right" :seed="3">
      <MBorder v-if="showPanel" :seed="5">
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
    <p class="demo__hint">左侧菜单切换组件时的整块内容切换，也是 MInkTransition 在做。</p>
  </div>
</template>
