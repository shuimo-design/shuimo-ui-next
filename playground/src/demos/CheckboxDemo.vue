<script setup lang="ts">
import { ref } from "vue";
import { MCheckbox, MCheckboxGroup, type CheckboxValue } from "@shuimo-design/ui";

// 旧文档「普通复选框」：默认勾上
const value = ref(true);
// 旧文档「伴随 Group」
const data = ref<CheckboxValue[]>(["极客江湖", "水墨组件"]);
const picks = ref<CheckboxValue[]>(["shan"]);
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">普通复选框</p>
      <MCheckbox v-model="value" label="极客江湖" />
      <p class="demo__hint">值：{{ value }}</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">禁用复选框</p>
      <div class="demo__row">
        <MCheckbox disabled label="极客江湖" />
        <MCheckbox :model-value="true" disabled label="禁用且勾选" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">半选</p>
      <MCheckbox :model-value="false" label="半选（只影响外观）" indeterminate />
    </div>

    <div class="demo__block">
      <p class="demo__caption">伴随 Group</p>
      <p class="demo__hint">已选中：{{ data.join("，") }}</p>
      <MCheckboxGroup v-model="data">
        <MCheckbox label="极客江湖" value="极客江湖" />
        <MCheckbox label="水墨组件" value="水墨组件" />
      </MCheckboxGroup>
    </div>

    <div class="demo__block">
      <p class="demo__caption">限制数量 · 竖排</p>
      <MCheckboxGroup v-model="picks" :max="2" direction="vertical">
        <MCheckbox value="shan" label="山" />
        <MCheckbox value="shui" label="水" />
        <MCheckbox value="yun" label="云" />
        <MCheckbox value="shi" label="石" />
      </MCheckboxGroup>
      <p class="demo__hint">最多选两个：{{ picks.join("、") || "空" }}</p>
    </div>

    <div class="demo__block">
      <p class="demo__caption">插槽写文字</p>
      <MCheckbox :model-value="true"> <em>江湖</em> 路远 </MCheckbox>
    </div>
  </div>
</template>
