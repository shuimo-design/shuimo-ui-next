<script setup lang="ts">
import { ref } from "vue";
import { MCollapse, MCollapseItem, type CollapseName } from "@shuimo-design/ui";

const isOpen = ref(false);
const log = ref("还没动过");
const opened = ref<CollapseName[]>(["one"]);
const accordion = ref<CollapseName | undefined>("a");

function handleChange(value: boolean) {
  log.value = `折叠面板状态改变：${value ? "展开" : "收起"}`;
}
</script>

<template>
  <div class="demo">
    <p class="demo__caption">基础用法：单个面板，标题后一笔画到边</p>
    <MCollapseItem title="欲卷珠帘春恨长">
      <p style="margin: 0">却下水晶帘，玲珑望秋月</p>
    </MCollapseItem>

    <p class="demo__caption">禁用状态</p>
    <MCollapseItem title="众里寻他千百度" disabled>
      <p style="margin: 0">蓦然回首，那人却在灯火阑珊处</p>
    </MCollapseItem>

    <p class="demo__caption">隐藏分割线</p>
    <MCollapseItem title="初极狭，才通人" :divider="false">
      <p style="margin: 0">复行数十步，豁然开朗</p>
    </MCollapseItem>

    <p class="demo__caption">事件：v-model + @change</p>
    <MCollapseItem v-model="isOpen" title="庭院深深深几许" @change="handleChange">
      <p style="margin: 0">乱红飞过秋千去</p>
    </MCollapseItem>
    <p class="demo__hint">{{ log }}（当前 {{ isOpen ? "展开" : "收起" }}）</p>

    <p class="demo__caption">自定义标题插槽</p>
    <MCollapseItem>
      <template #title>
        <span>山重水复疑无路 <small style="color: var(--m-fg-muted)">陆游</small></span>
      </template>
      <div style="padding: 8px 12px; background: color-mix(in srgb, var(--m-ink) 6%, transparent)">
        柳暗花明又一村
      </div>
    </MCollapseItem>

    <p class="demo__caption">成组：v-model 是展开项的 name 数组</p>
    <MCollapse v-model="opened">
      <MCollapseItem name="one" title="第一折">
        <p style="margin: 0">江流天地外，山色有无中。</p>
      </MCollapseItem>
      <MCollapseItem name="two" title="第二折">
        <p style="margin: 0">郡邑浮前浦，波澜动远空。</p>
      </MCollapseItem>
      <MCollapseItem name="three" title="禁用" disabled>
        <p style="margin: 0">看不到。</p>
      </MCollapseItem>
    </MCollapse>
    <p class="demo__hint">展开：{{ opened.join("、") || "无" }}</p>

    <p class="demo__caption">手风琴：同一时刻只开一项</p>
    <MCollapse v-model="accordion" accordion>
      <MCollapseItem name="a" title="甲">
        <p style="margin: 0">只开一个。</p>
      </MCollapseItem>
      <MCollapseItem name="b" title="乙">
        <p style="margin: 0">开我就关掉甲。</p>
      </MCollapseItem>
    </MCollapse>
  </div>
</template>
