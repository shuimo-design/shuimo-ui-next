<script setup lang="ts">
import "./skeleton.css";
import { IconEye } from "../../icons";
import type { SkeletonItemProps } from "./types";

defineOptions({ name: "MSkeletonItem" });

const { variant = "text" } = defineProps<SkeletonItemProps>();
</script>

<template>
  <div class="m-skeleton-item" :class="`m-skeleton-item--${variant}`" aria-hidden="true">
    <!-- 图片占位在中间放一只眼睛，让人知道这块将来是图 -->
    <IconEye v-if="variant === 'image'" class="m-skeleton-item__icon" />
  </div>
</template>
