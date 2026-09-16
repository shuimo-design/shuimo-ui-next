<script setup lang="ts">
import { MSealColophon, MStamp } from "@shuimo-design/vue";
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        作品末尾的署名块：落款语 + 署名 + 日期，印章取署名前两个字，压在末字右下。默认靠右
      </p>
      <div class="seal-colophon-demo__sheet">
        <p class="seal-colophon-demo__body">山色空蒙雨亦奇，欲把西湖比西子，淡妆浓抹总相宜。</p>
        <MSealColophon author="齐白石" text="写于丙午年秋" date="2026.09" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">靠左、阴文方章、自定义印文</p>
      <div class="seal-colophon-demo__sheet">
        <MSealColophon
          author="齐白石"
          text="借山馆主人"
          seal="借山"
          seal-shape="square"
          seal-mode="yin"
          align="left"
        />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">竖排落款：文字从上往下写，印章落在末字下面</p>
      <div class="seal-colophon-demo__sheet seal-colophon-demo__sheet--tall">
        <MSealColophon author="白石老人" text="丙午年秋月" vertical />
        <MSealColophon author="白石老人" text="丙午年秋月" vertical align="left" seal-mode="yin" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">默认插槽替换整段落款文，seal 插槽替换印章</p>
      <div class="seal-colophon-demo__sheet">
        <MSealColophon author="白石">
          乙巳年冬 <em>白石</em> 补记于京华
          <template #seal>
            <MStamp text="一期一会" shape="circle" direction="circular" :size="48" :seed="3" />
          </template>
        </MSealColophon>
      </div>
    </div>

    <p class="demo__hint">
      印章的种子默认固定，服务端和客户端盖的是同一枚；传 seed 换一枚。落款文走 --m-font-brush
      字体栈，没装毛笔字体时退回正文字体。
    </p>
  </div>
</template>
