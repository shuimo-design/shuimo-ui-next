<script setup lang="ts">
import { computed } from "vue";
import { skeletonItemClasses, type SkeletonItemProps } from "@shuimo-design/core";
import { IconEye } from "../../icons";

defineOptions({ name: "MSkeletonItem" });

const { variant = "text" } = defineProps<SkeletonItemProps>();

const rootClass = computed(() => skeletonItemClasses(variant));
</script>

<template>
  <div :class="rootClass" aria-hidden="true">
    <!-- 图片占位在中间放一只眼睛，让人知道这块将来是图 -->
    <IconEye v-if="variant === 'image'" class="m-skeleton-item__icon" />
  </div>
</template>
