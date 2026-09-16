<script setup lang="ts">
import { ref } from "vue";
import { MButton, MTimeline, MTimelineItem, type TimelineItem } from "@shuimo-design/vue";

const events: TimelineItem[] = [
  { key: "mo", label: "辰时", content: "磨墨。松烟入砚，徐徐研开。" },
  { key: "bi", label: "巳时", content: "润笔。饱蘸浓淡，试锋于废纸。", type: "primary" },
  { key: "zhi", label: "午时", content: "落纸。一气呵成，不作修饰。", type: "success" },
  { key: "yin", label: "申时", content: "钤印。朱砂一点，落款收笔。", type: "danger" },
];

const chapters: TimelineItem[] = [
  { label: "卷一", content: "山水", dot: "一" },
  { label: "卷二", content: "花鸟", dot: "二" },
  { label: "卷三", content: "人物", dot: "三" },
];

const log = ref<TimelineItem[]>([
  { label: "09:12", content: "开始上传" },
  { label: "09:15", content: "校验完成" },
]);
const reverse = ref(false);

function append() {
  const n = log.value.length;
  log.value = [
    ...log.value,
    { label: `09:${String(20 + n).padStart(2, "0")}`, content: `第 ${n + 1} 步完成` },
  ];
}
</script>

<template>
  <div class="demo">
    <p class="demo__caption">基础用法：items 一项一条，type 决定节点颜色</p>
    <MTimeline :items="events" />

    <p class="demo__caption">mode：right 轴线在右，alternate 左右交替</p>
    <div class="demo__row" style="align-items: flex-start; gap: 48px">
      <MTimeline :items="events" mode="right" style="flex: 1" />
      <MTimeline :items="events" mode="alternate" style="flex: 1" />
    </div>

    <p class="demo__caption">pending：末尾一段虚线和一个幽灵节点；reverse 倒序</p>
    <MTimeline :items="log" pending="进行中…" :reverse="reverse" />
    <div class="demo__row">
      <MButton @click="append">追加一步</MButton>
      <MButton @click="reverse = !reverse">{{ reverse ? "正序" : "倒序" }}</MButton>
    </div>

    <p class="demo__caption">dot 传一个字，节点变成带字的圈</p>
    <MTimeline :items="chapters" />

    <p class="demo__caption">子组件写法：MTimelineItem 的默认插槽是内容，dot 插槽是节点</p>
    <MTimeline>
      <MTimelineItem label="庚子" type="muted">
        <strong>初学</strong>，临《芥子园画谱》
      </MTimelineItem>
      <MTimelineItem label="辛丑" content="始画山水" />
      <MTimelineItem label="壬寅">
        <template #dot><span style="font-size: 11px">印</span></template>
        第一次刻印
      </MTimelineItem>
    </MTimeline>

    <p class="demo__caption">作用域插槽 dot / item：整条时间线统一自定义</p>
    <MTimeline :items="events" mode="alternate">
      <template #dot="{ index }">{{ index + 1 }}</template>
      <template #item="{ item }">
        <em>{{ item.label }}</em> · {{ item.content }}
      </template>
    </MTimeline>
  </div>
</template>
