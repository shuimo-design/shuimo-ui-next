<script setup lang="ts">
import { ref } from "vue";
import { MRate } from "@shuimo-design/vue";

const basic = ref(3);
const half = ref(2.5);
const hovered = ref(0);
const texted = ref(4);
const texts = ["差", "一般", "还行", "不错", "很好"];
const seasons = ["春", "夏", "秋", "冬"];
const custom = ref(2);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">基本用法：点击落值，再点当前值归零</p>
      <div class="demo__row">
        <MRate v-model="basic" />
        <span class="demo__hint">{{ basic }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">allowHalf：指针落在一格左半就是半格；hoverChange 报预览值</p>
      <div class="demo__row">
        <MRate v-model="half" allow-half @hover-change="hovered = $event" />
        <span class="demo__hint">value: {{ half }} / hover: {{ hovered }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">texts：每档右侧文字，悬停时跟着预览值变</p>
      <div class="demo__row">
        <MRate v-model="texted" :texts="texts" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">尺寸：sm / md / lg</p>
      <div class="demo__row">
        <MRate :model-value="3" size="sm" />
        <MRate :model-value="3" />
        <MRate :model-value="3" size="lg" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">readonly 只展示；disabled 不响应且退出 Tab 序列；count 可改</p>
      <div class="demo__row">
        <MRate :model-value="3.5" allow-half readonly />
        <MRate :model-value="2" disabled />
        <MRate :model-value="6" :count="10" size="sm" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        character 插槽：自定义每一格；seed 换一组墨团；朱砂色用 --m-rate-active
      </p>
      <div class="demo__row">
        <MRate v-model="custom" :count="4">
          <template #character="{ index, active }">
            <span :style="{ fontWeight: active ? 700 : 400 }">{{ seasons[index] }}</span>
          </template>
        </MRate>
        <MRate :model-value="4" :seed="9" style="--m-rate-active: var(--m-seal)" />
      </div>
    </div>
  </div>
</template>
