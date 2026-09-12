<script setup lang="ts">
import { computed, watch } from "vue";
import {
  createSkeleton,
  skeletonClasses,
  skeletonRows,
  type SkeletonProps,
  type SkeletonSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import MSkeletonItem from "./MSkeletonItem.vue";

// 真实内容是插槽片段，class / style 只落到骨架根上
defineOptions({ name: "MSkeleton", inheritAttrs: false });

const {
  loading = true,
  animated = false,
  rows = 3,
  avatar = false,
  title = true,
  throttle = 0,
} = defineProps<SkeletonProps>();
defineSlots<SkeletonSlots>();

// throttle 窗口内什么都不画：数据很快回来的话，用户根本看不到骨架闪一下。定时器在 core 的控制器里
const { controller: skeleton, state } = useController(createSkeleton, () => ({
  loading,
  throttle,
}));
watch(() => loading, skeleton.setLoading);

const rootClass = computed(() => skeletonClasses(animated));
const paragraph = computed(() => skeletonRows(rows));
</script>

<template>
  <slot v-if="!loading" />
  <div v-else-if="state.visible" :class="rootClass" aria-busy="true" v-bind="$attrs">
    <slot name="template">
      <div class="m-skeleton__default">
        <MSkeletonItem v-if="avatar" class="m-skeleton__avatar" variant="circle" />
        <div class="m-skeleton__content">
          <MSkeletonItem v-if="title" class="m-skeleton__title" variant="h3" />
          <div v-if="paragraph.length > 0" class="m-skeleton__paragraph">
            <MSkeletonItem v-for="i in paragraph" :key="i" class="m-skeleton__row" variant="text" />
          </div>
        </div>
      </div>
    </slot>
  </div>
</template>
