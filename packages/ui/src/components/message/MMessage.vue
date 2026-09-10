<script setup lang="ts">
// 样式必须从 SFC 自己引：rolldown 会跳过只做转发的 index.ts，那里的副作用引入会被丢掉
import "./message.css";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { useElementSize } from "@vueuse/core";
import { IconClose } from "../../icons";
import { inkBadgeUrl, type InkBadgeKind } from "../../ink/assets/badge";
import { inkRidgeUrl } from "../../ink/assets/ridge";
import { inkShapeUrl } from "../../ink/assets/shape";
import { revealElement, type WipeMaskOptions } from "../../ink/reveal";
import {
  animateMessage,
  enterKeyframes,
  leaveKeyframes,
  type MessageMotionBox,
  type MessageShift,
} from "./animate";
import type {
  MessageDirection,
  MessageEmits,
  MessageProps,
  MessageSlots,
  MessageType,
} from "./types";

defineOptions({ name: "MMessage" });

const {
  type = "info",
  content = "",
  duration = 3000,
  direction = "top-right",
  dragAllow = true,
  closable = false,
  seed = 1,
} = defineProps<MessageProps>();
const emit = defineEmits<MessageEmits>();
const slots = defineSlots<MessageSlots>();

const BADGE: Record<MessageType, InkBadgeKind> = {
  success: "check",
  warning: "bang",
  error: "cross",
  info: "info",
};

/** 擦入方向和滑入方向一致：从右滑入的就从右边擦出来 */
const REVEAL: Record<MessageDirection, NonNullable<WipeMaskOptions["direction"]>> = {
  "top-right": "left",
  "bottom-right": "left",
  "top-left": "right",
  "bottom-left": "right",
  "top-center": "down",
  "bottom-center": "up",
};

const root = useTemplateRef<HTMLElement>("root");
const { width, height } = useElementSize(root, undefined, { box: "border-box" });
const closing = ref(false);
const dragging = ref(false);
const removing = ref(false);
const shift = ref<MessageShift>({ x: 0, y: 0 });

// 毛边墨纸按消息实际尺寸生成（8px 分桶缓存），远山是一张固定小图当 mask
const shape = computed(() =>
  width.value && height.value
    ? inkShapeUrl(width.value, height.value, { seed, raggedness: 0.7, corner: 0.1 })
    : undefined,
);
const ridge = inkRidgeUrl({ seed, width: 200, height: 80, layers: 2, opacity: 0.7 });
const style = computed(() => ({
  "--m-message-badge": `url("${inkBadgeUrl(BADGE[type], { seed })}")`,
  "--m-message-shape": shape.value ? `url("${shape.value.url}")` : undefined,
  "--m-message-shape-pad": shape.value ? `${shape.value.padding}px` : undefined,
  "--m-message-ridge": `url("${ridge.url}")`,
  transform:
    shift.value.x || shift.value.y
      ? `translate(${shift.value.x}px, ${shift.value.y}px)`
      : undefined,
}));

function motionBox(el: HTMLElement): MessageMotionBox {
  const parent = el.parentElement;
  const gap = parent ? Number.parseFloat(getComputedStyle(parent).rowGap) : 0;
  return { width: el.offsetWidth, height: el.offsetHeight, gap: Number.isNaN(gap) ? 0 : gap };
}

let timer: ReturnType<typeof setTimeout> | undefined;

function stopTimer() {
  clearTimeout(timer);
  timer = undefined;
}

function startTimer() {
  stopTimer();
  if (duration <= 0 || closing.value) return;
  timer = setTimeout(close, duration);
}

async function close() {
  const el = root.value;
  if (closing.value || !el) return;
  closing.value = true;
  stopTimer();
  await animateMessage(el, leaveKeyframes(direction, motionBox(el), shift.value), "forwards");
  emit("close");
}

/** 只能往「出去」的那一边拖：右侧往右、左侧往左、顶部居中往上、底部居中往下 */
const axis = computed<"x" | "y">(() => (direction.endsWith("center") ? "y" : "x"));
const sign = computed(() =>
  direction.endsWith("right") || direction === "bottom-center" ? 1 : -1,
);
let dragStart = 0;
let pointerId: number | undefined;

function onPointerDown(event: PointerEvent) {
  if (!dragAllow || closing.value || event.button !== 0) return;
  // 点关闭按钮不算拖
  if (event.target instanceof Element && event.target.closest(".m-message__close")) return;
  pointerId = event.pointerId;
  dragStart = axis.value === "x" ? event.clientX : event.clientY;
  dragging.value = true;
  stopTimer();
  try {
    root.value?.setPointerCapture(event.pointerId);
  } catch {
    // 合成事件没有活动指针，拿不到捕获也不影响拖
  }
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== pointerId) return;
  const raw = (axis.value === "x" ? event.clientX : event.clientY) - dragStart;
  const delta = raw * sign.value > 0 ? raw : 0;
  shift.value = axis.value === "x" ? { x: delta, y: 0 } : { x: 0, y: delta };
  // 直接量 DOM：ResizeObserver 报上来的尺寸有延迟，刚挂载就拖会拿到 0
  const el = root.value;
  const size = el ? (axis.value === "x" ? el.offsetWidth : el.offsetHeight) : 0;
  removing.value = size > 0 && Math.abs(delta) > size / 3;
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value || event.pointerId !== pointerId) return;
  dragging.value = false;
  pointerId = undefined;
  if (removing.value) {
    void close();
    return;
  }
  shift.value = { x: 0, y: 0 };
  startTimer();
}

function onMouseLeave() {
  if (!dragging.value) startTimer();
}

onMounted(() => {
  const el = root.value;
  if (!el) return;
  void animateMessage(el, enterKeyframes(direction, motionBox(el)), "none");
  if (document.documentElement.classList.contains("m-ink-ready")) {
    void revealElement(el, { seed, direction: REVEAL[direction], duration: 600 });
  }
  startTimer();
});
onBeforeUnmount(stopTimer);

defineExpose({ close });
</script>

<template>
  <div
    ref="root"
    class="m-message"
    :class="[
      `m-message--${type}`,
      `m-message--${direction}`,
      {
        'm-message--dragging': dragging,
        'm-message--removing': removing,
        'm-message--closing': closing,
      },
    ]"
    :style="style"
    role="status"
    @mouseenter="stopTimer"
    @mouseleave="onMouseLeave"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
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
    <button v-if="closable" type="button" class="m-message__close" aria-label="关闭" @click="close">
      <IconClose />
    </button>
  </div>
</template>
