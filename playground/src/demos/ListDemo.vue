<script setup lang="ts">
import { ref } from "vue";
import { MList, MListItem } from "@shuimo-design/ui";

interface Sword {
  title: string;
  active?: boolean;
}

const swords: Sword[] = [{ title: "轩辕剑", active: true }, { title: "湛卢" }, { title: "赤霄" }];
const names = ["轩辕剑", "湛卢", "赤霄"];
const poems = ["江流天地外", "山色有无中", "郡邑浮前浦", "波澜动远空"];
const activePoem = ref(1);
</script>

<template>
  <div class="demo">
    <p class="demo__caption">普通列表：数据项带 active 字段的那项用激活样式</p>
    <MList :data="swords">
      <template #default="{ item }">
        <span>{{ item.title }}</span>
      </template>
    </MList>

    <p class="demo__caption">使用激活状态样式：autoActive 让所有项都激活</p>
    <MList :data="names" auto-active />

    <p class="demo__caption">不要项目符号</p>
    <MList :data="names" :marker="false" />

    <p class="demo__caption">自己放 MListItem，点击切换 active</p>
    <MList>
      <MListItem
        v-for="(poem, index) in poems"
        :key="poem"
        :active="index === activePoem"
        @click="activePoem = index"
      >
        {{ poem }}
      </MListItem>
    </MList>
  </div>
</template>
