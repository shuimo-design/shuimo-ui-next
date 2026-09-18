<script setup lang="ts">
import { ref } from "vue";
import { MButton, MCarousel, MCarouselItem, type VueCarouselItem } from "@shuimo-design/vue";

/** 示例图：三幅内联 SVG，山、水、云 */
function picture(label: string, ink: string, paper: string) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">` +
        `<rect width="320" height="200" fill="${paper}"/>` +
        `<path d="M0 160 C60 90 120 120 160 70 S260 100 320 60 V200 H0Z" fill="${ink}" opacity="0.85"/>` +
        `<text x="24" y="48" font-size="28" fill="${ink}" font-family="serif">${label}</text>` +
        `</svg>`,
    )
  );
}
const pictures: VueCarouselItem[] = [
  { key: "shan", src: picture("山", "#1c1c1c", "#f7f4ec"), alt: "山" },
  { key: "shui", src: picture("水", "#1661ab", "#eef3f8"), alt: "水" },
  { key: "yun", src: picture("云", "#74787a", "#f2f0ea"), alt: "云" },
];

const current = ref(0);
const log = ref<string[]>([]);
function onChange(next: number, previous: number) {
  log.value = [...log.value.slice(-4), `${previous} → ${next}`];
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        基础用法：items 一项一张，给了 src 就是一张铺满的图；箭头悬停时浮现，底部一排墨点
      </p>
      <MCarousel :items="pictures" :height="200" style="max-width: 480px" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        autoplay：true 每 4 秒翻一张，传数字指定毫秒；悬停、聚焦时暂停。arrows="always" 箭头常驻
      </p>
      <MCarousel
        :items="pictures"
        :height="200"
        :autoplay="2500"
        arrows="always"
        style="max-width: 480px"
      />
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        v-model:current 受控；loop 关掉后两头的箭头禁用；change 事件报新旧下标。容器可聚焦，← →
        翻页，Home / End 到两头
      </p>
      <MCarousel
        v-model:current="current"
        :items="pictures"
        :height="200"
        :loop="false"
        style="max-width: 480px"
        @change="onChange"
      />
      <div class="demo__row">
        <MButton @click="current = 0">第一张</MButton>
        <MButton @click="current = 2">最后一张</MButton>
        <span class="demo__hint">当前 {{ current }}；最近变化：{{ log.join("，") || "无" }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">direction="vertical" 上下翻，指示器挪到右侧，↑ ↓ 翻页</p>
      <MCarousel :items="pictures" :height="200" direction="vertical" style="max-width: 480px" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        子组件写法：MCarouselItem 的默认插槽是这一张的内容，没给 height 时由当前那张撑开；seed
        换一粒墨点
      </p>
      <MCarousel :seed="7" indicator="dots" arrows="always" style="max-width: 480px">
        <MCarouselItem key="poem-1">
          <div class="carousel-demo__card">
            <strong>空山新雨后</strong>
            <span>天气晚来秋</span>
          </div>
        </MCarouselItem>
        <MCarouselItem key="poem-2">
          <div class="carousel-demo__card">
            <strong>明月松间照</strong>
            <span>清泉石上流</span>
          </div>
        </MCarouselItem>
        <MCarouselItem key="poem-3">
          <div class="carousel-demo__card">
            <strong>竹喧归浣女</strong>
            <span>莲动下渔舟</span>
          </div>
        </MCarouselItem>
      </MCarousel>
    </div>
  </div>
</template>

<style scoped>
.carousel-demo__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 48px 16px;
  border: 1px solid var(--m-border);
  color: var(--m-fg);
}
</style>
