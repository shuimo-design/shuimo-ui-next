<script setup lang="ts">
import "./scroll.css";
import { useResizeObserver } from "@vueuse/core";
import { computed, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from "vue";
import { brushLineUrl } from "../../ink/assets/line";
import type { ScrollEmits, ScrollProps, ScrollSlots } from "./types";

defineOptions({ name: "MScroll" });

const { height, maxHeight, always = false, minThumb = 20 } = defineProps<ScrollProps>();
const emit = defineEmits<ScrollEmits>();
defineSlots<ScrollSlots>();

type Axis = "v" | "h";

interface BarState {
  /** 轨道长度 px；0 表示这个方向没有溢出，不画滚动条 */
  track: number;
  /** 滑块长度 px */
  thumb: number;
  /** 滑块距轨道起点的偏移 px */
  offset: number;
}

const root = useTemplateRef<HTMLElement>("root");
const view = useTemplateRef<HTMLElement>("view");
const content = useTemplateRef<HTMLElement>("content");
const bars = reactive<Record<Axis, BarState>>({
  v: { track: 0, thumb: 0, offset: 0 },
  h: { track: 0, thumb: 0, offset: 0 },
});
const scrolling = ref(false);
const dragging = ref(false);
let scrollTimer: ReturnType<typeof setTimeout> | undefined;
let stopDrag: (() => void) | undefined;

const LINE_THICKNESS = 6;
const viewStyle = computed(() => ({
  height: toCss(height),
  maxHeight: toCss(maxHeight),
}));

function toCss(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

/** 滚动条槽位宽度：从 CSS 变量读，用户覆盖 --m-scroll-size 时布局跟着走 */
function gutter(): number {
  const el = root.value;
  if (!el) return 10;
  const raw = Number.parseFloat(getComputedStyle(el).getPropertyValue("--m-scroll-size"));
  return Number.isFinite(raw) ? raw : 10;
}

/** 按视口与内容的尺寸重算两条滚动条；尺寸变化、滚动都走这里 */
function measure() {
  const el = view.value;
  if (!el) return;
  const { clientWidth, clientHeight, scrollWidth, scrollHeight, scrollTop, scrollLeft } = el;
  // 差 1px 以内算没溢出，免得子像素误差让滚动条闪出来
  const hasV = scrollHeight > clientHeight + 1;
  const hasH = scrollWidth > clientWidth + 1;
  const size = gutter();
  update(bars.v, hasV, clientHeight - (hasH ? size : 0), clientHeight, scrollHeight, scrollTop);
  update(bars.h, hasH, clientWidth - (hasV ? size : 0), clientWidth, scrollWidth, scrollLeft);
}

function update(
  bar: BarState,
  visible: boolean,
  track: number,
  client: number,
  scroll: number,
  position: number,
) {
  if (!visible || track <= 0) {
    bar.track = 0;
    bar.thumb = 0;
    bar.offset = 0;
    return;
  }
  const thumb = Math.min(track, Math.max(minThumb, (track * client) / scroll));
  const range = scroll - client;
  bar.track = track;
  bar.thumb = thumb;
  bar.offset = range > 0 ? (position / range) * (track - thumb) : 0;
}

/** 滑块那一笔按实际长度生成，长度按 8px 分桶，拖拽缩放时不至于每帧都重画 SVG */
function thumbMask(axis: Axis) {
  const bucket = Math.max(24, Math.ceil(bars[axis].thumb / 8) * 8);
  return brushLineUrl({
    seed: axis === "v" ? 11 : 12,
    length: bucket,
    thickness: LINE_THICKNESS,
    vertical: axis === "v",
  });
}

function barStyle(axis: Axis) {
  const bar = bars[axis];
  const line = thumbMask(axis);
  const band = axis === "v" ? line.width : line.height;
  return {
    "--m-scroll-track": `${bar.track}px`,
    "--m-scroll-thumb-length": `${bar.thumb}px`,
    "--m-scroll-thumb-offset": `${bar.offset}px`,
    "--m-scroll-thumb-mask": `url("${line.url}")`,
    "--m-scroll-band": `${band}px`,
  };
}

function onScroll() {
  const el = view.value;
  if (!el) return;
  measure();
  emit("scroll", { scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });
  scrolling.value = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => (scrolling.value = false), 800);
}

/** 滚动条盖在视口上，滚轮落在滑块上时把滚动量转给视口 */
function onThumbWheel(event: WheelEvent) {
  view.value?.scrollBy({ left: event.deltaX, top: event.deltaY });
}

function startDrag(axis: Axis, event: PointerEvent) {
  const el = view.value;
  if (!el || event.button !== 0) return;
  event.preventDefault();
  stopDrag?.();
  const bar = bars[axis];
  const vertical = axis === "v";
  const start = vertical ? event.clientY : event.clientX;
  const startScroll = vertical ? el.scrollTop : el.scrollLeft;
  const range = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
  const free = bar.track - bar.thumb;
  // 指针每挪 1px，内容要滚多少 px
  const ratio = free > 0 ? range / free : 0;
  dragging.value = true;

  const move = (ev: PointerEvent) => {
    const delta = (vertical ? ev.clientY : ev.clientX) - start;
    if (vertical) el.scrollTop = startScroll + delta * ratio;
    else el.scrollLeft = startScroll + delta * ratio;
  };
  const stop = () => {
    dragging.value = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    stopDrag = undefined;
  };
  // 监听挂在 window 上：指针滑出滑块甚至滑出组件也不丢
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
  stopDrag = stop;
}

function scrollTo(options: ScrollToOptions) {
  view.value?.scrollTo(options);
}

useResizeObserver([view, content], measure);
onMounted(measure);
onBeforeUnmount(() => {
  clearTimeout(scrollTimer);
  stopDrag?.();
});

defineExpose({ scrollTo, update: measure, view });
</script>

<template>
  <div
    ref="root"
    class="m-scroll"
    :class="{
      'm-scroll--always': always,
      'm-scroll--scrolling': scrolling,
      'm-scroll--dragging': dragging,
    }"
  >
    <div ref="view" class="m-scroll__view" :style="viewStyle" @scroll.passive="onScroll">
      <div ref="content" class="m-scroll__content">
        <slot />
      </div>
    </div>
    <div
      v-if="bars.v.track > 0"
      class="m-scroll__bar m-scroll__bar--v"
      :style="barStyle('v')"
      aria-hidden="true"
    >
      <div
        class="m-scroll__thumb"
        @pointerdown="startDrag('v', $event)"
        @wheel.prevent="onThumbWheel"
      />
    </div>
    <div
      v-if="bars.h.track > 0"
      class="m-scroll__bar m-scroll__bar--h"
      :style="barStyle('h')"
      aria-hidden="true"
    >
      <div
        class="m-scroll__thumb"
        @pointerdown="startDrag('h', $event)"
        @wheel.prevent="onThumbWheel"
      />
    </div>
  </div>
</template>
