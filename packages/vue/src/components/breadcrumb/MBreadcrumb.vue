<script setup lang="ts">
import { computed, provide } from "vue";
import {
  BREADCRUMB_LABEL,
  breadcrumbStyle,
  type BreadcrumbContextValue,
  type BreadcrumbProps,
  type BreadcrumbSlots,
} from "@shuimo-design/core";
import { breadcrumbKey } from "./context";
import MBreadcrumbItem from "./MBreadcrumbItem.vue";

defineOptions({ name: "MBreadcrumb" });

const { separator, options = [] } = defineProps<BreadcrumbProps>();
const slots = defineSlots<BreadcrumbSlots>();

provide(breadcrumbKey, {
  value: computed<BreadcrumbContextValue>(() => ({ separator })),
  separatorSlot: () => slots.separator,
});

// 分隔符那一笔斜杠：子项不 Teleport，变量声明在根上就够了
const inkStyle = breadcrumbStyle();
</script>

<template>
  <nav class="m-breadcrumb" :aria-label="BREADCRUMB_LABEL" :style="inkStyle">
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
