<script setup lang="ts">
import { MButton, MCard, MStamp, MTag } from "@shuimo-design/ui";
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        册页：每张卡是一页毛边宣纸。三种框型都是一笔画出来的笔触框，只差粗细——plain 细一笔、double
        中等（默认）、brush 粗一笔带飞白；没开 ink 引擎时退回单线 / 双线
      </p>
      <div class="demo__row card-demo__grid">
        <MCard title="单线" frame="plain" :seed="1">墙角数枝梅，凌寒独自开。</MCard>
        <MCard title="双线" :seed="2">遥知不是雪，为有暗香来。</MCard>
        <MCard title="笔触" frame="brush" :seed="3">疏影横斜水清浅，暗香浮动月黄昏。</MCard>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        阴影：hover 悬停出现（默认）、always 常显、never 不要；水墨模式下是顺着纸缘洇开的墨影
      </p>
      <div class="demo__row card-demo__grid">
        <MCard title="hover" shadow="hover" :seed="4">鼠标移上来看看。</MCard>
        <MCard title="always" shadow="always" :seed="5">一直有一层洇开的墨影。</MCard>
        <MCard title="never" shadow="never" :seed="6">安安静静。</MCard>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        header / extra / footer 插槽，标题左侧一笔朱批、标题下那条线是按卡片宽度生成的笔触
      </p>
      <div class="demo__row card-demo__grid">
        <MCard :seed="7">
          <template #header>
            <span>题跋</span>
            <MTag size="sm" style="margin-left: 8px">新</MTag>
          </template>
          <template #extra>
            <MButton type="text">更多</MButton>
          </template>
          山色空蒙雨亦奇。
          <template #footer>癸卯年春 · 西湖</template>
        </MCard>
        <MCard :seed="8" shadow="always">
          <template #cover>
            <div class="card-demo__cover" />
          </template>
          封面区裁在边框里，和内容一起。
        </MCard>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">seal 插槽：在右下角盖一枚印，不占内容流、微微探出框外并歪一点</p>
      <div class="demo__row card-demo__grid">
        <MCard title="落款" :seed="10">
          春水碧于天，画船听雨眠。
          <template #footer>韦庄 · 菩萨蛮</template>
          <template #seal>
            <MStamp text="听雨" :size="44" :seed="10" />
          </template>
        </MCard>
        <MCard title="收藏" shadow="always" :seed="11">
          <template #cover>
            <div class="card-demo__cover" />
          </template>
          封面、正文、印都在，印压在框和内容之上。
          <template #seal>
            <MStamp :text="['水墨', '丹青']" shape="square" mode="yin" :size="40" :seed="11" />
          </template>
        </MCard>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">无边框、自定义内边距</p>
      <div class="demo__row card-demo__grid">
        <MCard :bordered="false" shadow="always" :padding="12"
          >bordered=false，只靠阴影分层。</MCard
        >
        <MCard title="紧凑" padding="8px 12px" :seed="9">padding 可以是数字或任意 CSS 值。</MCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  align-items: stretch;
}
.card-demo__cover {
  height: 96px;
  background: linear-gradient(135deg, var(--m-success), var(--m-info));
}
</style>
