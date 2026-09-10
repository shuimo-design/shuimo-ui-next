<script setup lang="ts">
import "./skeleton.css";
import { onBeforeUnmount, ref, watch } from "vue";
import MSkeletonItem from "./MSkeletonItem.vue";
import type { SkeletonProps, SkeletonSlots } from "./types";

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

// throttle 窗口内什么都不画：数据很快回来的话，用户根本看不到骨架闪一下
const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function clearTimer() {
  if (timer === undefined) return;
  clearTimeout(timer);
  timer = undefined;
}

watch(
  () => loading,
  (value) => {
    clearTimer();
    if (!value || throttle <= 0) {
      visible.value = value;
      return;
    }
    visible.value = false;
    timer = setTimeout(() => {
      visible.value = true;
      timer = undefined;
    }, throttle);
  },
  { immediate: true },
);
onBeforeUnmount(clearTimer);
</script>

<template>
  <slot v-if="!loading" />
  <div
    v-else-if="visible"
    class="m-skeleton"
    :class="{ 'm-skeleton--animated': animated }"
    aria-busy="true"
    v-bind="$attrs"
  >
    <slot name="template">
      <div class="m-skeleton__default">
        <MSkeletonItem v-if="avatar" class="m-skeleton__avatar" variant="circle" />
        <div class="m-skeleton__content">
          <MSkeletonItem v-if="title" class="m-skeleton__title" variant="h3" />
          <div v-if="rows > 0" class="m-skeleton__paragraph">
            <MSkeletonItem v-for="i in rows" :key="i" class="m-skeleton__row" variant="text" />
          </div>
        </div>
      </div>
    </slot>
  </div>
</template>
