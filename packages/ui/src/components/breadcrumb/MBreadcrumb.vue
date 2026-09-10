<script setup lang="ts">
import "./breadcrumb.css";
import { provide, toRef } from "vue";
import { inkMarkUrl } from "../../ink/assets/mark";
import { breadcrumbKey } from "./context";
import MBreadcrumbItem from "./MBreadcrumbItem.vue";
import type { BreadcrumbProps, BreadcrumbSlots } from "./types";

defineOptions({ name: "MBreadcrumb" });

const { separator, options = [] } = defineProps<BreadcrumbProps>();
const slots = defineSlots<BreadcrumbSlots>();

provide(breadcrumbKey, {
  separator: toRef(() => separator),
  separatorSlot: () => slots.separator,
});

// 分隔符那一笔斜杠：子项不 Teleport，变量声明在根上就够了
const inkStyle = {
  "--m-breadcrumb-slash": `url("${inkMarkUrl("slash", { seed: 2, strokeWidth: 2.2 })}")`,
};
</script>

<template>
  <nav class="m-breadcrumb" aria-label="面包屑" :style="inkStyle">
    <ol class="m-breadcrumb__list">
      <template v-if="options.length">
        <MBreadcrumbItem
          v-for="(option, index) in options"
          :key="index"
          :content="option.content"
          :href="option.href"
        />
      </template>
      <slot v-else />
    </ol>
  </nav>
</template>
