<script setup lang="ts">
import { ref } from "vue";
import { MDeleteIcon } from "@shuimo-design/ui";

const items = ref(["兰亭序", "祭侄稿", "寒食帖"]);
const clicks = ref(0);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">默认是一支斜放的毛笔，悬停蘸朱砂；kind="cross" 是一笔叉</p>
      <div class="demo__row">
        <MDeleteIcon @click="clicks++" />
        <MDeleteIcon :size="48" @click="clicks++" />
        <MDeleteIcon kind="cross" @click="clicks++" />
        <MDeleteIcon kind="cross" :size="20" :seed="5" @click="clicks++" />
        <MDeleteIcon disabled />
        <MDeleteIcon kind="cross" disabled />
      </div>
      <p class="demo__hint">点了 {{ clicks }} 次</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">列表里删一项</p>
      <ul class="delete-icon-demo__list">
        <li v-for="(item, i) in items" :key="item">
          <span>{{ item }}</span>
          <MDeleteIcon :size="24" :label="`删除${item}`" @click="items.splice(i, 1)" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.delete-icon-demo__list {
  display: grid;
  gap: 8px;
  width: 240px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.delete-icon-demo__list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
