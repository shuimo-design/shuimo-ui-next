<script setup lang="ts">
import { ref } from "vue";
import { MImage } from "@shuimo-design/vue";

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
const shan = picture("山", "#1c1c1c", "#f7f4ec");
const shui = picture("水", "#1661ab", "#eef3f8");
const yun = picture("云", "#74787a", "#f2f0ea");
const album = [shan, shui, yun];

const opened = ref(0);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">基本用法：给宽高，fit 决定图怎么填；点击打开全屏预览</p>
      <div class="demo__row">
        <MImage :src="shan" alt="山" :width="200" :height="120" fit="cover" />
        <MImage :src="shan" alt="山" :width="200" :height="120" fit="contain" />
        <MImage :src="shan" alt="山" :width="200" :height="120" fit="fill" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        previewSrcList：预览里可以翻页（按钮、← →、循环）；滚轮缩放，Esc 或点遮罩关闭
      </p>
      <div class="demo__row">
        <MImage
          v-for="(src, index) in album"
          :key="index"
          :src="src"
          :alt="['山', '水', '云'][index]"
          :width="160"
          :height="100"
          fit="cover"
          :preview-src-list="album"
          @show="opened++"
        />
        <span class="demo__hint">打开过 {{ opened }} 次</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        加载失败：默认文案，或用 error 插槽自定义；placeholder 插槽换掉加载中的骨架
      </p>
      <div class="demo__row">
        <MImage src="/not-exist.png" alt="坏图" :width="160" :height="100" />
        <MImage src="/not-exist.png" alt="坏图" :width="160" :height="100">
          <template #error><span>这张图丢了</span></template>
        </MImage>
        <MImage :src="yun" alt="云" :width="160" :height="100" fit="cover">
          <template #placeholder><span>正在研墨…</span></template>
        </MImage>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">preview=false 只当图看；lazy 用原生懒加载</p>
      <div class="demo__row">
        <MImage :src="shui" alt="水" :width="160" :height="100" fit="cover" :preview="false" />
        <MImage :src="shui" alt="水" :width="160" :height="100" fit="cover" lazy />
      </div>
    </div>
  </div>
</template>
