<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import {
  createNotificationItem,
  notificationClasses,
  notificationRole,
  notificationStyle,
  NOTIFICATION_CLOSE_LABEL,
  NOTIFICATION_DURATION,
  type NotificationEmits,
  type NotificationProps,
  type NotificationSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import MDeleteIcon from "../delete-icon/MDeleteIcon.vue";

defineOptions({ name: "MNotification" });

const {
  title,
  content = "",
  type,
  duration = NOTIFICATION_DURATION,
  closable = true,
  placement = "top-right",
  seed = 1,
  closing = false,
} = defineProps<
  NotificationProps & {
    /** 渲染出口推下来的"请你离场"信号；手写 <MNotification> 时不用管它 */
    closing?: boolean;
  }
>();
const emit = defineEmits<NotificationEmits>();
const slots = defineSlots<NotificationSlots>();

// 倒计时、悬停暂停、进出场动画、尺寸测量全在 core 的控制器里，React 那边用的是同一份
const { controller: item, state } = useController(createNotificationItem, () => ({
  placement,
  duration,
  seed,
  onClose: () => emit("close"),
}));

const root = useTemplateRef<HTMLElement>("root");
// flush: "post" —— 元素真的挂上了再交给控制器，它拿到元素才好量尺寸、起进场动画
watch(root, (el) => item.setRoot(el), { immediate: true, flush: "post" });
// 外部请求离场：状态在队列那边，控制器只接一个开关
watch(
  () => closing,
  (value) => item.setClosing(value),
  { flush: "post" },
);

const classes = computed(() =>
  notificationClasses({ type, placement, closable, closing: state.value.closing }),
);
const style = computed(() =>
  notificationStyle({ type, seed, width: state.value.width, height: state.value.height }),
);
const hasContent = computed(() => Boolean(slots.default || content));

defineExpose({ close: item.close });
</script>

<template>
  <div
    ref="root"
    :class="classes"
    :style="style"
    :role="notificationRole(type)"
    @mouseenter="item.onMouseEnter"
    @mouseleave="item.onMouseLeave"
  >
    <span
      v-if="slots.icon"
      class="m-notification__icon m-notification__icon--custom"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
    <span v-else-if="type" class="m-notification__icon" aria-hidden="true" />
    <div class="m-notification__body">
      <div class="m-notification__title">{{ title }}</div>
      <div v-if="hasContent" class="m-notification__content">
        <slot>{{ content }}</slot>
      </div>
    </div>
    <MDeleteIcon
      v-if="closable"
      class="m-notification__close"
      kind="cross"
      :size="20"
      :label="NOTIFICATION_CLOSE_LABEL"
      :seed="seed"
      @click="item.close"
    />
  </div>
</template>
