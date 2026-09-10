<script setup lang="ts">
import { ref } from "vue";
import { MButton, MStep, MSteps, type StepStatus } from "@shuimo-design/ui";

const active = ref(1);
const status = ref<StepStatus>("process");

function next() {
  active.value = active.value >= 4 ? 0 : active.value + 1;
}
</script>

<template>
  <div class="demo">
    <p class="demo__caption">
      基础用法：active 是当前步序号（从 0 起），之前的算完成，之后的算等待
    </p>
    <MSteps :active="active" :status="status">
      <MStep title="磨墨" description="松烟入砚，徐徐研开" />
      <MStep title="润笔" description="饱蘸浓淡" />
      <MStep title="落纸" description="一气呵成" />
      <MStep title="钤印" description="朱砂一点" />
    </MSteps>
    <div class="demo__row">
      <MButton @click="next">下一步</MButton>
      <MButton @click="status = status === 'error' ? 'process' : 'error'">
        {{ status === "error" ? "恢复" : "当前步出错" }}
      </MButton>
      <span class="demo__hint">active = {{ active }}，status = {{ status }}</span>
    </div>

    <p class="demo__caption">紧凑版：只有节点和标题</p>
    <MSteps :active="2" simple>
      <MStep title="磨墨" />
      <MStep title="润笔" />
      <MStep title="落纸" />
      <MStep title="钤印" />
    </MSteps>

    <p class="demo__caption">出错：status="error" 只作用在当前步</p>
    <MSteps :active="2" status="error">
      <MStep title="磨墨" description="松烟入砚" />
      <MStep title="润笔" description="饱蘸浓淡" />
      <MStep title="落纸" description="墨洇了" />
      <MStep title="钤印" description="朱砂一点" />
    </MSteps>

    <p class="demo__caption">单步覆盖 status、自定义 icon / title / description 插槽</p>
    <MSteps :active="1">
      <MStep title="登录">
        <template #icon><span style="font-size: 12px">印</span></template>
      </MStep>
      <MStep>
        <template #title>填写<small style="color: var(--m-fg-muted)">（可选）</small></template>
        <template #description><em>插槽里的描述</em></template>
      </MStep>
      <MStep title="跳过" status="finish" description="被标成完成" />
      <MStep title="完成" />
    </MSteps>

    <p class="demo__caption">纵向</p>
    <div class="demo__row" style="align-items: flex-start; gap: 64px">
      <MSteps :active="1" direction="vertical">
        <MStep title="磨墨" description="松烟入砚，徐徐研开" />
        <MStep title="润笔" description="饱蘸浓淡" />
        <MStep title="落纸" description="一气呵成" />
        <MStep title="钤印" description="朱砂一点" />
      </MSteps>
      <MSteps :active="2" direction="vertical" simple>
        <MStep title="磨墨" />
        <MStep title="润笔" />
        <MStep title="落纸" />
        <MStep title="钤印" />
      </MSteps>
    </div>
  </div>
</template>
