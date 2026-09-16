<script setup lang="ts">
import { ref } from "vue";
import {
  MButton,
  MDescriptions,
  MDescriptionsItem,
  MTag,
  type DescriptionsItem,
  type DescriptionsSize,
} from "@shuimo-design/vue";

const painting: DescriptionsItem[] = [
  { key: "title", label: "画名", value: "溪山行旅图" },
  { key: "author", label: "作者", value: "范宽" },
  { key: "era", label: "年代", value: "北宋" },
  { key: "size", label: "尺幅", value: "206.3 × 103.3 cm" },
  { key: "material", label: "材质", value: "绢本墨笔" },
  { key: "place", label: "藏地", value: "台北故宫博物院" },
  {
    key: "note",
    label: "题跋",
    value: "树叶间有「范宽」二字款，董其昌题「北宋范中立溪山行旅图」。",
    span: 3,
  },
];

const sizes: DescriptionsSize[] = ["sm", "md", "lg"];
const size = ref<DescriptionsSize>("md");
const bordered = ref(true);
</script>

<template>
  <div class="demo">
    <p class="demo__caption">基础用法：items 一项一格，默认一行三列，span 占多列</p>
    <MDescriptions title="作品信息" :items="painting" />

    <p class="demo__caption">bordered 画格线；size 三档；extra 放在标题右侧</p>
    <MDescriptions title="作品信息" :items="painting" :bordered="bordered" :size="size">
      <template #extra><MButton @click="bordered = !bordered">切换格线</MButton></template>
    </MDescriptions>
    <div class="demo__row">
      <MButton v-for="s in sizes" :key="s" @click="size = s">{{ s }}</MButton>
      <span class="demo__hint">size = {{ size }}</span>
    </div>

    <p class="demo__caption">layout="vertical"：标签一行、值在下一行</p>
    <MDescriptions :items="painting" layout="vertical" bordered :column="4" />

    <p class="demo__caption">子组件写法：MDescriptionsItem 的默认插槽是值，label 插槽是标签</p>
    <MDescriptions title="装裱" :column="2">
      <MDescriptionsItem label="形制" value="立轴" />
      <MDescriptionsItem label="状态">
        <MTag type="success" size="sm">已修复</MTag>
      </MDescriptionsItem>
      <MDescriptionsItem label="说明" :span="2">
        <template #label><em>说明</em></template>
        绫边略有虫蛀，画心完好。
      </MDescriptionsItem>
    </MDescriptions>

    <p class="demo__caption">作用域插槽 label / value：统一改所有格子</p>
    <MDescriptions :items="painting.slice(0, 3)" bordered :colon="false">
      <template #label="{ item }">「{{ item.label }}」</template>
      <template #value="{ item }"
        ><strong>{{ item.value }}</strong></template
      >
    </MDescriptions>
  </div>
</template>
