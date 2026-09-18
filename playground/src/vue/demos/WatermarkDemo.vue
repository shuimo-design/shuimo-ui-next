<script setup lang="ts">
import { ref } from "vue";
import { MButton, MSlider, MWatermark } from "@shuimo-design/vue";

const rotate = ref(-22);
const gapX = ref(100);
const seed = ref(1);

/** 一枚朱砂圆章当图片水印 */
const seal = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="#a83a2a" stroke-width="4"/><text x="32" y="40" text-anchor="middle" font-size="22" fill="#a83a2a" font-family="serif">印</text></svg>',
)}`;

function tamper(event: MouseEvent) {
  const root = (event.currentTarget as HTMLElement).closest(".demo__block");
  root?.querySelector(".m-watermark__layer")?.remove();
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">文字水印：多行、字号、间距、旋转；同 seed 同晕染</p>
      <div class="demo__row watermark-demo__controls">
        <label>rotate <MSlider v-model="rotate" :min="-90" :max="90" /></label>
        <label>gap <MSlider v-model="gapX" :min="20" :max="240" /></label>
        <label>seed <MSlider v-model="seed" :min="1" :max="20" /></label>
      </div>
      <MWatermark
        :content="['水墨', '丹青不渝']"
        :font="{ size: 16 }"
        :rotate="rotate"
        :gap="[gapX, 100]"
        :seed="seed"
        class="watermark-demo__sheet"
      >
        <p>水印铺在内容之上，不接鼠标。文字画成遮罩，墨色跟随深浅主题；水墨皮下字边带一点洇。</p>
        <p>山色有无中，江流天地外。</p>
      </MWatermark>
    </div>

    <div class="demo__block">
      <p class="demo__caption">图片水印：传 image 就不画字，按 width / height 放</p>
      <MWatermark
        :image="seal"
        :width="48"
        :height="48"
        :gap="[80, 80]"
        class="watermark-demo__sheet"
      >
        <p>朱砂印一枚一枚铺开。</p>
      </MWatermark>
    </div>

    <div class="demo__block">
      <p class="demo__caption">ink=false 是干净的字；font.color 换墨色</p>
      <MWatermark
        content="内部资料"
        :ink="false"
        :font="{ color: 'rgb(168 58 42 / 0.25)', weight: 700 }"
        class="watermark-demo__sheet"
      >
        <p>没有晕染，朱砂色。</p>
      </MWatermark>
    </div>

    <div class="demo__block">
      <p class="demo__caption">防篡改：从 DOM 里删掉水印层，下一帧就贴回来</p>
      <MWatermark content="删不掉" class="watermark-demo__sheet">
        <MButton @click="tamper">删掉水印层</MButton>
      </MWatermark>
    </div>
  </div>
</template>
