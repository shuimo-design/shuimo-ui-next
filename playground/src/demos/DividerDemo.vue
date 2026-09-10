<script setup lang="ts">
import { MDivider } from "@shuimo-design/ui";
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通分割线：按实际宽度生成的一笔，不同 seed 飞白位置不同</p>
      <MDivider />
      <MDivider :seed="7" :thickness="2" />
    </div>

    <div class="demo__block">
      <p class="demo__caption">带文字</p>
      <MDivider text="居中" />
      <MDivider text="靠左" align="left" />
      <MDivider align="right"><em>插槽也行</em></MDivider>
    </div>

    <div class="demo__block">
      <p class="demo__caption">垂直分割线：在 flex 行里自动拉伸到整行高，单独用时自己设 height</p>
      <div class="demo__row" style="height: 48px">
        <span>山</span>
        <MDivider vertical />
        <span>水</span>
        <MDivider vertical :seed="3" />
        <span>云</span>
      </div>
      <div class="demo__row">
        <MDivider vertical style="height: 160px" :thickness="6" />
        <MDivider vertical style="height: 160px" text="题跋" />
      </div>
    </div>
  </div>
</template>
