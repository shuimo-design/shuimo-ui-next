<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  badgeClasses,
  badgeContent,
  badgeInk,
  badgeVisible,
  type BadgeProps,
  type BadgeSlots,
} from "@shuimo-design/core";

defineOptions({ name: "MBadge" });

const props = defineProps<BadgeProps>();
const slots = defineSlots<BadgeSlots>();

const content = computed(() => badgeContent(props));

// 数字变了就换个 key 让 sup 重挂一次，CSS 动画随之重播；首次挂载不弹
const bump = ref(0);
watch(content, () => {
  bump.value += 1;
});

// 素材登记要有样式表：服务端和水合首帧一律内联，挂载之后才升级成 data 属性
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const ink = computed(() => badgeInk(props, mounted.value));
</script>

<template>
  <span :class="badgeClasses(props, Boolean(slots.default))" :style="ink.style" v-bind="ink.attrs">
    <slot />
    <sup
      v-if="badgeVisible(props)"
      :key="bump"
      class="m-badge__sup"
      :class="{ 'm-badge__sup--bump': bump > 0 }"
      :aria-hidden="props.dot ? 'true' : undefined"
      >{{ content }}</sup
    >
  </span>
</template>
