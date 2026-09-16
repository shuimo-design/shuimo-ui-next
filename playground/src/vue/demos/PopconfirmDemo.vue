<script setup lang="ts">
import { ref } from "vue";
import { MButton, MPopconfirm, type PopconfirmPlacement } from "@shuimo-design/vue";

const result = ref("-");
const open = ref(false);
const placements: PopconfirmPlacement[] = ["top", "bottom", "left", "right"];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">点击触发：确定 / 取消各发一个事件，点外面和 Esc 算取消</p>
      <div class="demo__row">
        <MPopconfirm
          title="确定删除这一项？"
          content="删除后不可恢复"
          @confirm="result = 'confirm'"
          @cancel="result = 'cancel'"
        >
          <MButton type="error">删除</MButton>
        </MPopconfirm>
        <span class="demo__hint">result {{ result }}</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">按钮文字与类型、不带徽记、方位、禁用</p>
      <div class="demo__row">
        <MPopconfirm
          title="发布这篇文章？"
          confirm-text="发布"
          cancel-text="再看看"
          confirm-type="confirm"
        >
          <MButton>发布</MButton>
        </MPopconfirm>
        <MPopconfirm title="不带徽记的确认" :icon="false">
          <MButton>无徽记</MButton>
        </MPopconfirm>
        <MPopconfirm
          v-for="placement in placements"
          :key="placement"
          :placement="placement"
          :title="`placement: ${placement}`"
        >
          <MButton>{{ placement }}</MButton>
        </MPopconfirm>
        <MPopconfirm title="不会弹出" disabled>
          <MButton disabled>禁用</MButton>
        </MPopconfirm>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">title / content 插槽；v-model:open 双向绑定</p>
      <div class="demo__row">
        <MPopconfirm v-model:open="open" title="清空回收站">
          <MButton>清空</MButton>
          <template #title>
            <span>清空<b>回收站</b>？</span>
          </template>
          <template #content>
            <span>共 <b>12</b> 项将被永久删除</span>
          </template>
        </MPopconfirm>
        <span class="demo__hint">open {{ open }}</span>
      </div>
    </div>
  </div>
</template>
