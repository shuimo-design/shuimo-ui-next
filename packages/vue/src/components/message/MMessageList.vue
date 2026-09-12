<script setup lang="ts">
// 某个方向的消息列表容器。由 MOverlayOutlet 渲染，不对外导出
import {
  messageListClasses,
  MESSAGE_LIST_LABEL,
  type MessageDirection,
  type MessageEntry,
} from "@shuimo-design/core";
import MMessage from "./MMessage.vue";

defineOptions({ name: "MMessageList" });

const { direction, items } = defineProps<{
  direction: MessageDirection;
  items: readonly MessageEntry[];
  /** 某条的离场动画走完了 */
  onRemove: (id: number) => void;
}>();
</script>

<template>
  <div
    :class="messageListClasses(direction)"
    role="region"
    aria-live="polite"
    :aria-label="MESSAGE_LIST_LABEL"
  >
    <MMessage
      v-for="entry in items"
      :key="entry.id"
      v-bind="entry.props"
      :direction="direction"
      :closing="entry.closing"
      @close="onRemove(entry.id)"
    />
  </div>
</template>
