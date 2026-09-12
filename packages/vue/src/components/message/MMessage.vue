<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import {
  createMessageItem,
  messageClasses,
  messageStyle,
  MESSAGE_CLOSE_LABEL,
  type MessageEmits,
  type MessageProps,
  type MessageSlots,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useController } from "../../runtime";

defineOptions({ name: "MMessage" });

const {
  type = "info",
  content = "",
  duration = 3000,
  direction = "top-right",
  dragAllow = true,
  closable = false,
  seed = 1,
  closing = false,
} = defineProps<
  MessageProps & {
    /** 渲染出口推下来的"请你离场"信号；手写 <MMessage> 时不用管它 */
    closing?: boolean;
  }
>();
const emit = defineEmits<MessageEmits>();
const slots = defineSlots<MessageSlots>();

// 倒计时、悬停暂停、拖动关闭、进出场动画、尺寸测量全在 core 的控制器里，React 那边用的是同一份
const { controller: item, state } = useController(createMessageItem, () => ({
  direction,
  duration,
  dragAllow,
  seed,
  onClose: () => emit("close"),
}));

const root = useTemplateRef<HTMLElement>("root");
// flush: "post" —— 元素真的挂上了再交给控制器，它拿到元素才好量尺寸、起进场动画
watch(root, (el) => item.setRoot(el), { immediate: true, flush: "post" });
// 外部请求离场：和 MDialog 的 modal.setOpen 一个路数，状态在队列那边，控制器只接一个开关
watch(
  () => closing,
  (value) => item.setClosing(value),
  { flush: "post" },
);

const classes = computed(() =>
  messageClasses({
    type,
    direction,
    dragging: state.value.dragging,
    removing: state.value.removing,
    closing: state.value.closing,
  }),
);
const style = computed(() =>
  messageStyle({
    type,
    seed,
    width: state.value.width,
    height: state.value.height,
    x: state.value.x,
    y: state.value.y,
  }),
);

defineExpose({ close: item.close });
</script>

<template>
  <div
    ref="root"
    :class="classes"
    :style="style"
    role="status"
    @mouseenter="item.onMouseEnter"
    @mouseleave="item.onMouseLeave"
    @pointerdown="item.onPointerDown"
    @pointermove="item.onPointerMove"
    @pointerup="item.onPointerUp"
    @pointercancel="item.onPointerUp"
  >
    <span
      class="m-message__icon"
      :class="{ 'm-message__icon--custom': slots.icon }"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
    <div class="m-message__content">
      <slot>{{ content }}</slot>
    </div>
    <button
      v-if="closable"
      type="button"
      class="m-message__close"
      :aria-label="MESSAGE_CLOSE_LABEL"
      @click="item.close"
    >
      <IconClose />
    </button>
  </div>
</template>
