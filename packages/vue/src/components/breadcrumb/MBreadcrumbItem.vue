<script setup lang="ts">
import { computed, inject } from "vue";
import {
  breadcrumbSeparatorKind,
  type BreadcrumbItemProps,
  type BreadcrumbItemSlots,
} from "@shuimo-design/core";
import { breadcrumbKey } from "./context";

defineOptions({ name: "MBreadcrumbItem" });

const { content, href } = defineProps<BreadcrumbItemProps>();
defineSlots<BreadcrumbItemSlots>();

const breadcrumb = inject(breadcrumbKey, undefined);
// 父组件的 separator 插槽当函数式组件渲染，每一项各画一份
const SeparatorSlot = computed(() => breadcrumb?.separatorSlot());
// 画哪种分隔符的判断在 core，两个壳才不会各判一套
const kind = computed(() =>
  breadcrumbSeparatorKind({
    custom: Boolean(SeparatorSlot.value),
    context: breadcrumb?.value.value,
  }),
);
const separatorText = computed(() => breadcrumb?.value.value.separator);
</script>

<template>
  <li class="m-breadcrumb-item">
    <span class="m-breadcrumb-item__separator" aria-hidden="true">
      <component :is="SeparatorSlot" v-if="kind === 'custom'" />
      <template v-else-if="kind === 'text'">{{ separatorText }}</template>
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
