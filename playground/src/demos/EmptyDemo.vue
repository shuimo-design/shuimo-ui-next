<script setup lang="ts">
import { MButton, MEmpty } from "@shuimo-design/ui";
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">默认：一笔圆 + 「暂无数据」</p>
      <MEmpty />
    </div>

    <div class="demo__block">
      <p class="demo__caption">image="ridge"：远山；说明文字和下面的操作区都能自定义</p>
      <MEmpty image="ridge" description="还没有收藏任何东西">
        <MButton>去逛逛</MButton>
      </MEmpty>
    </div>

    <div class="demo__block">
      <p class="demo__caption">imageSize 控制插图高度；seed 换一张不一样的圆</p>
      <div class="demo__row">
        <MEmpty :image-size="60" description="小一点" style="flex: 1" />
        <MEmpty :image-size="160" :seed="5" description="大一点，换个种子" style="flex: 1" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">image="none" 不画插图；image 插槽放自己的图</p>
      <div class="demo__row">
        <MEmpty image="none" description="什么都没有" style="flex: 1" />
        <MEmpty description="自己的插图" style="flex: 1">
          <template #image>
            <svg
              viewBox="0 0 64 64"
              width="96"
              height="96"
              fill="none"
              stroke="var(--m-fg-muted)"
              stroke-width="2"
            >
              <rect x="10" y="18" width="44" height="32" rx="2" />
              <path d="M10 30h44M22 18v-6h20v6" />
            </svg>
          </template>
        </MEmpty>
      </div>
    </div>
  </div>
</template>
