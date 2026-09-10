<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { MButton, MInputNumber, MVirtualList, type VirtualListExpose } from "@shuimo-design/ui";

const STEMS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const fixed = Array.from({ length: 10_000 }, (_, i) => `${STEMS[i % 12]} · 第 ${i + 1} 项`);

interface Note {
  title: string;
  body: string;
}
const notes = ref<Note[]>(
  Array.from({ length: 2_000 }, (_, i) => ({
    title: `札记 ${i + 1}`,
    body: "山色空蒙雨亦奇。".repeat(1 + (i % 5)),
  })),
);

const target = ref(500);
// 泛型组件拿不到 InstanceType，直接用它暴露出来的方法类型
const fixedList = useTemplateRef<VirtualListExpose>("fixedList");
const bottomHits = ref(0);

function loadMore() {
  bottomHits.value++;
  const from = notes.value.length;
  notes.value = notes.value.concat(
    Array.from({ length: 200 }, (_, i) => ({
      title: `札记 ${from + i + 1}`,
      body: "水光潋滟晴方好。".repeat(1 + ((from + i) % 4)),
    })),
  );
}
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">定高：一万项，itemHeight 固定，只渲染可视区附近的几十个节点</p>
      <MVirtualList ref="fixedList" :list="fixed" :item-height="36" :height="240" divider>
        <template #default="{ data, index }">
          <div class="vl-row">
            <span class="vl-row__index">{{ index + 1 }}</span>
            <span>{{ data }}</span>
          </div>
        </template>
      </MVirtualList>
      <div class="demo__row">
        <MInputNumber v-model="target" :min="1" :max="fixed.length" />
        <MButton @click="fixedList?.scrollTo(target - 1, 'start')">滚到第 {{ target }} 项</MButton>
        <MButton @click="fixedList?.scrollTo(target - 1, 'center')">居中</MButton>
        <MButton @click="fixedList?.scrollTo(0)">回顶</MButton>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">
        变高：不传 itemHeight，先按 estimatedItemHeight 估、渲染后实测；滚到底触发 reachBottom
        追加数据（已触发
        {{ bottomHits }} 次，共 {{ notes.length }} 条）
      </p>
      <MVirtualList
        :list="notes"
        :estimated-item-height="56"
        :height="280"
        :buffer="4"
        divider
        @reach-bottom="loadMore"
      >
        <template #default="{ data }">
          <div class="vl-note">
            <strong>{{ data.title }}</strong>
            <p class="vl-note__body">{{ data.body }}</p>
          </div>
        </template>
      </MVirtualList>
    </div>
  </div>
</template>

<style scoped>
.vl-row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  padding: 0 12px;
}
.vl-row__index {
  min-width: 3em;
  color: var(--m-fg-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.vl-note {
  padding: 10px 12px;
}
.vl-note__body {
  margin: 4px 0 0;
  color: var(--m-fg-muted);
  font-size: 13px;
  line-height: 1.6;
}
</style>
