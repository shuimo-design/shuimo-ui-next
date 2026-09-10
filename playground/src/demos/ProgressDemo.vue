<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { MButton, MProgress } from "@shuimo-design/ui";

const progress = ref(36);
const loopPer = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = setInterval(() => {
    loopPer.value = loopPer.value < 1000 ? loopPer.value + 1 : 0;
  }, 16);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">建议实践：value 20 / max 100，显示百分比</p>
      <div class="demo__row">
        <MProgress :value="20" :max="100" :show-info="true" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">隐藏信息：value 300 / max 1000</p>
      <div class="demo__row">
        <MProgress :value="300" :max="1000" :show-info="false" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">动起来 + 默认 slot 自定义文字</p>
      <div class="demo__row">
        <MProgress :value="loopPer" :max="1000">
          <span>{{ Math.ceil(loopPer / 10) }}%</span>
        </MProgress>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">status / strokeWidth / 自定义宽度</p>
      <div class="demo__row">
        <MProgress :value="progress" />
        <MProgress :value="progress" status="success" :stroke-width="4" />
        <MProgress :value="progress" status="warn" />
        <MProgress :value="100" status="danger">
          <template #default="{ percent }">{{ percent }} 分</template>
        </MProgress>
      </div>
      <div class="demo__row">
        <MProgress :value="progress" :stroke-width="12" style="--m-progress-w: 360px" />
      </div>
      <div class="demo__row">
        <MButton @click="progress = Math.max(0, progress - 10)">-10</MButton>
        <MButton @click="progress = Math.min(100, progress + 10)">+10</MButton>
      </div>
    </div>
  </div>
</template>
