<script setup lang="ts">
import { ref } from "vue";
import { MRadio, MRadioGroup } from "@shuimo-design/ui";

// 旧文档「普通单选框」：单个 radio 直接 v-model，选中后把 value 写进去
const value = ref("");
const season = ref("chun");
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通单选框</p>
      <p class="demo__hint">选择参数: {{ value || "（未选）" }}</p>
      <MRadio v-model="value" value="janghood">极客江湖</MRadio>
    </div>

    <div class="demo__block">
      <p class="demo__caption">单选组</p>
      <MRadioGroup v-model="season">
        <MRadio value="chun" label="春" />
        <MRadio value="xia" label="夏" />
        <MRadio value="qiu" label="秋" />
        <MRadio value="dong" label="冬" disabled />
      </MRadioGroup>
      <p class="demo__hint">当前：{{ season }}</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">竖排</p>
      <MRadioGroup v-model="season" direction="vertical">
        <MRadio value="chun" label="竖排 · 春" />
        <MRadio value="xia" label="竖排 · 夏" />
      </MRadioGroup>
    </div>

    <div class="demo__block">
      <p class="demo__caption">禁用</p>
      <div class="demo__row">
        <MRadio value="a" model-value="a" label="禁用且选中" disabled />
        <MRadio value="b" label="禁用" disabled />
      </div>
    </div>
  </div>
</template>
