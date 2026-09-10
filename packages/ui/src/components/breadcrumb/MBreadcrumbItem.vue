<script setup lang="ts">
import "./breadcrumb.css";
import { computed, inject } from "vue";
import { breadcrumbKey } from "./context";
import type { BreadcrumbItemProps, BreadcrumbItemSlots } from "./types";

defineOptions({ name: "MBreadcrumbItem" });

const { content, href } = defineProps<BreadcrumbItemProps>();
defineSlots<BreadcrumbItemSlots>();

const breadcrumb = inject(breadcrumbKey, undefined);
const separatorText = computed(() => breadcrumb?.separator.value);
// 父组件的 separator 插槽当函数式组件渲染，每一项各画一份
const SeparatorSlot = computed(() => breadcrumb?.separatorSlot());
</script>

<template>
  <li class="m-breadcrumb-item">
    <span class="m-breadcrumb-item__separator" aria-hidden="true">
      <component :is="SeparatorSlot" v-if="SeparatorSlot" />
      <template v-else-if="separatorText">{{ separatorText }}</template>
      <i v-else class="m-breadcrumb-item__slash" />
    </span>
    <a v-if="href" class="m-breadcrumb-item__content" :href="href"
      ><slot>{{ content }}</slot></a
    >
    <span v-else class="m-breadcrumb-item__content"
      ><slot>{{ content }}</slot></span
    >
  </li>
</template>
