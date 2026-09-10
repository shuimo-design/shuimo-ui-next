<script setup lang="ts">
import { ref } from "vue";
import { MInputNumber } from "@shuimo-design/ui";

const number = ref<number | undefined>(0);
const price = ref<number | undefined>(9.5);
</script>

<template>
  <div class="demo">
    <!-- 旧文档：普通数字输入框，限定 -10 ~ 10 -->
    <div class="demo__block">
      <p class="demo__caption">数字为：{{ number }}</p>
      <MInputNumber v-model="number" :max="10" :min="-10" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">步长与小数位、禁用、只读、不带按钮</p>
      <div class="demo__row">
        <MInputNumber v-model="price" :step="0.5" :precision="2" placeholder="价" />
        <MInputNumber :model-value="7" disabled />
        <MInputNumber :model-value="7" readonly />
        <MInputNumber :model-value="1" :controls="false" />
      </div>
    </div>

    <p class="demo__hint">price {{ price }}</p>
  </div>
</template>
