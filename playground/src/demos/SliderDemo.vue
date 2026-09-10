<script setup lang="ts">
import { ref } from "vue";
import { MSlider, type SliderValue } from "@shuimo-design/ui";

const basic = ref(0);
const bounded = ref(25);
const current = ref(50);
const committed = ref(50);
const stepped = ref(40);
const span = ref<[number, number]>([20, 60]);

function onChange(value: SliderValue) {
  committed.value = Array.isArray(value) ? value[0] : value;
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通滑动条</p>
      <div class="demo__row">
        <MSlider v-model="basic" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">边界：min -50 / max 50</p>
      <div class="demo__row">
        <span>{{ bounded }}</span>
        <MSlider v-model="bounded" :min="-50" :max="50" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">change：拖动中 v-model 实时变，松手才发 change</p>
      <div>
        <div class="demo__hint">current value: {{ current }}</div>
        <div class="demo__hint">change value: {{ committed }}</div>
      </div>
      <div class="demo__row">
        <MSlider v-model="current" :min="0" :max="100" @change="onChange" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">showInfo：轨道上方显示 min / 百分比 / max</p>
      <div class="demo__row">
        <MSlider v-model="stepped" show-info :step="5" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">range + formatTooltip</p>
      <div class="demo__row">
        <MSlider v-model="span" range :step="5" :format-tooltip="(v: number) => `${v}%`" />
        <span class="demo__hint">{{ span.join(" ~ ") }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">disabled / 自定义宽度</p>
      <div class="demo__row">
        <MSlider :model-value="30" disabled />
        <MSlider :model-value="70" style="--m-slider-w: 320px" />
      </div>
    </div>
  </div>
</template>
