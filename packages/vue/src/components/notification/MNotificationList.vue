<script setup lang="ts">
// 某个角的通知栈容器。由 MOverlayOutlet 渲染，不对外导出
import {
  notificationListClasses,
  NOTIFICATION_LIST_LABEL,
  type NotificationEntry,
  type NotificationPlacement,
} from "@shuimo-design/core";
import MNotification from "./MNotification.vue";

defineOptions({ name: "MNotificationList" });

const { placement, items } = defineProps<{
  placement: NotificationPlacement;
  items: readonly NotificationEntry[];
  /** 某条的离场动画走完了 */
  onRemove: (id: number) => void;
}>();
</script>

<template>
  <div
    :class="notificationListClasses(placement)"
    role="region"
    aria-live="polite"
    :aria-label="NOTIFICATION_LIST_LABEL"
  >
    <MNotification
      v-for="entry in items"
      :key="entry.id"
      v-bind="entry.props"
      :placement="placement"
      :closing="entry.closing"
      @close="onRemove(entry.id)"
    />
  </div>
</template>
