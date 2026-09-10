<script setup lang="ts">
import { MBreadcrumb, MBreadcrumbItem } from "@shuimo-design/ui";

const options = [
  { content: "首页", href: "#breadcrumb" },
  { content: "列表" },
  { content: "详情" },
];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">用 options 渲染</p>
      <MBreadcrumb :options="options" />
    </div>
    <div class="demo__block">
      <p class="demo__caption">用子项渲染</p>
      <MBreadcrumb>
        <MBreadcrumbItem href="#breadcrumb">首页</MBreadcrumbItem>
        <MBreadcrumbItem>列表</MBreadcrumbItem>
      </MBreadcrumb>
    </div>
    <div class="demo__block">
      <p class="demo__caption">自定义分隔符：文字 / 插槽</p>
      <MBreadcrumb separator=">" :options="options" />
      <MBreadcrumb :options="options">
        <template #separator><span style="color: var(--m-accent)">·</span></template>
      </MBreadcrumb>
    </div>
  </div>
</template>
