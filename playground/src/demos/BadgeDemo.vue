<script setup lang="ts">
import { ref } from "vue";
import { MBadge, MButton } from "@shuimo-design/ui";

const count = ref(3);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">
        朱砂小印：数字盖成一枚毛边小方印，超过 max 显示 "max+"；value
        变化时重盖一次，先略大按下再落实
      </p>
      <div class="demo__row badge-demo__row">
        <MBadge :value="count">
          <span class="badge-demo__box" />
        </MBadge>
        <MBadge :value="count" :max="10">
          <span class="badge-demo__box" />
        </MBadge>
        <MButton @click="count++">+1</MButton>
        <MButton @click="count = 0">归零</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        语义色只换印泥：danger（默认，朱砂）/ primary / success / warn / info，印形不变
      </p>
      <div class="demo__row badge-demo__row">
        <MBadge :value="5"><span class="badge-demo__box" /></MBadge>
        <MBadge :value="5" type="primary"><span class="badge-demo__box" /></MBadge>
        <MBadge :value="5" type="success"><span class="badge-demo__box" /></MBadge>
        <MBadge :value="5" type="warn"><span class="badge-demo__box" /></MBadge>
        <MBadge :value="5" type="info"><span class="badge-demo__box" /></MBadge>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">小点是一滴洇开的朱砂；文字印、showZero、hidden、offset</p>
      <div class="demo__row badge-demo__row">
        <MBadge dot><span class="badge-demo__box" /></MBadge>
        <MBadge value="新"><span class="badge-demo__box" /></MBadge>
        <MBadge :value="0" show-zero><span class="badge-demo__box" /></MBadge>
        <MBadge :value="9" hidden><span class="badge-demo__box" /></MBadge>
        <MBadge :value="9" :offset="[-6, 6]"><span class="badge-demo__box" /></MBadge>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">没有默认插槽时独立成印，回到文档流；seed 换一枚印的毛边走向</p>
      <div class="demo__row">
        <MBadge :value="12" />
        <MBadge :value="1000" :max="999" type="primary" />
        <MBadge value="草稿" type="info" />
        <MBadge dot type="success" />
        <MBadge :value="7" :seed="9" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge-demo__row {
  gap: 28px;
}
.badge-demo__box {
  display: inline-block;
  width: 40px;
  height: 40px;
  border-radius: var(--m-radius);
  background: var(--m-neutral);
}
</style>
