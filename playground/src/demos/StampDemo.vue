<script setup lang="ts">
import { ref } from "vue";
import { MButton, MStamp } from "@shuimo-design/ui";

const seed = ref(7);
const mode = ref<"yang" | "yin">("yang");
const roughness = ref(0.5);
const carving = ref(0.8);
const bleed = ref(0.7);
const text = ref("水墨丹青");

function roll() {
  seed.value = Math.floor(Math.random() * 100000);
}
</script>

<template>
  <div class="demo stamp-demo">
    <div class="demo__block">
      <p class="demo__caption">
        阳文（朱文）与阴文（白文）。印文是浏览器渲染的 SVG
        文字，边框、磨损、印泥白斑、刀刻崩口都是运行时按种子生成的
      </p>
      <div class="demo__row">
        <MStamp text="水墨" :seed="seed" />
        <MStamp text="水墨" mode="yin" :seed="seed" />
        <MStamp :text="['水墨', '丹青']" shape="square" :seed="seed" />
        <MStamp :text="['水墨', '丹青']" shape="square" mode="yin" :seed="seed" />
        <MButton size="sm" @click="roll">换个种子（{{ seed }}）</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">形状：auto 贴文 / square / rect / circle / ellipse / polygon</p>
      <div class="demo__row">
        <MStamp text="听雨" :seed="seed" />
        <MStamp text="听雨" shape="square" :seed="seed" />
        <MStamp text="听雨" shape="rect" :aspect="1.6" :seed="seed" />
        <MStamp text="听雨" shape="circle" :seed="seed" />
        <MStamp text="听雨" shape="ellipse" :aspect="1.4" :seed="seed" />
        <MStamp text="听雨" shape="polygon" :sides="6" :seed="seed" />
        <MStamp
          text="听雨"
          shape="polygon"
          :sides="8"
          orientation="point-top"
          mode="yin"
          :seed="seed"
        />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">多列印文：数组每项一列，第一项在最右；界格只在阴章上抠</p>
      <div class="demo__row">
        <MStamp :text="['落梅听', '风雪']" :size="150" :seed="seed" />
        <MStamp :text="['落梅听', '风雪']" :size="150" mode="yin" grid-lines :seed="seed" />
        <MStamp
          text="宠辱不惊闲看庭前花开花落"
          :size="180"
          shape="square"
          mode="yin"
          grid-lines
          :seed="seed"
        />
        <MStamp text="一期一会" :size="120" shape="circle" direction="circular" :seed="seed" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        质感旋钮：磨损 roughness / 刀刻 carving / 印泥 bleed，全 0 就是干净的矢量章
      </p>
      <div class="demo__row stamp-demo__controls">
        <label>印文 <input v-model="text" /></label>
        <label
          >模式
          <select v-model="mode">
            <option value="yang">阳文</option>
            <option value="yin">阴文</option>
          </select>
        </label>
        <label
          >磨损 <input v-model.number="roughness" type="range" min="0" max="1" step="0.05" />
          {{ roughness }}</label
        >
        <label
          >刀刻 <input v-model.number="carving" type="range" min="0" max="1" step="0.05" />
          {{ carving }}</label
        >
        <label
          >印泥 <input v-model.number="bleed" type="range" min="0" max="1" step="0.05" />
          {{ bleed }}</label
        >
      </div>
      <div class="demo__row">
        <MStamp
          :text="text"
          :size="200"
          shape="square"
          :mode="mode"
          :roughness="roughness"
          :carving="carving"
          :bleed="bleed"
          :seed="seed"
        />
        <MStamp
          :text="text"
          :size="200"
          shape="square"
          :mode="mode"
          :roughness="0"
          :carving="0"
          :bleed="0"
          :seed="seed"
        />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        颜色、字体、歪一点盖：color / font / rotate。默认字体先找篆体，找不到退衬线
      </p>
      <div class="demo__row">
        <MStamp text="闲章" color="#1a2847" :seed="seed" />
        <MStamp text="闲章" font="'Songti SC', serif" :seed="seed" />
        <MStamp text="闲章" font="'Kaiti SC', 'STKaiti', serif" mode="yin" :seed="seed" />
        <MStamp text="闲章" :rotate="-6" :seed="seed" />
        <MStamp text="闲章" :size="64" :seed="seed" />
        <MStamp text="闲章" :size="48" mode="yin" :seed="seed" />
      </div>
    </div>
  </div>
</template>

<style>
/* 示例站自带一份篆体（峄山碑篆体，仅示例用）；组件默认字体栈第一项就是它 */
@font-face {
  font-family: "峄山碑篆体";
  src: url("/fonts/yishanbeizhuanti.woff2") format("woff2");
  font-display: swap;
}

.stamp-demo__controls {
  gap: 16px;
  font-size: 13px;
}
.stamp-demo__controls label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
