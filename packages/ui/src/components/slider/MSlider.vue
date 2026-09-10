<script setup lang="ts">
import "./slider.css";
import { computed, ref, useTemplateRef } from "vue";
import { brushLineUrl } from "../../ink/assets/line";
import { useDisabled, useFormItem } from "../../internal/form-item";
import type { SliderEmits, SliderProps, SliderValue } from "./types";

defineOptions({ name: "MSlider" });

const {
  min = 0,
  max = 100,
  step = 1,
  disabled: disabledProp = false,
  range = false,
  showInfo = false,
  showTooltip = true,
  formatTooltip,
} = defineProps<SliderProps>();
const emit = defineEmits<SliderEmits>();
const model = defineModel<SliderValue>();

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const rail = useTemplateRef<HTMLElement>("rail");
// 轨道那一抹：按默认宽度 200px 生成，起笔在左、越往右越细；m.ink 层按画幅高铺、横向拉到实际宽度
const line = brushLineUrl({ seed: 5, length: 200, thickness: 8, taper: 0.5, endPad: 4 });
const inkStyle = {
  "--m-slider-line-mask": `url("${line.url}")`,
  "--m-slider-line-band": `${line.height}px`,
};
const thumbEls = useTemplateRef<HTMLElement[]>("thumbs");
/** 正在拖的滑块下标，-1 表示没在拖 */
const active = ref(-1);
/** 按下时的值，松手时对比决定要不要发 change */
let pressedValue: SliderValue | undefined;
/** 拖动中最后写出去的值；父组件回写 props 是异步的，松手时不能靠 model 取 */
let draggedValue: SliderValue | undefined;

function decimalsOf(value: number): number {
  const text = String(value);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

/** 钳制到 [min, max] 并对齐到 step 格点；max 不在格点上时仍可到达 */
function align(value: number): number {
  if (!Number.isFinite(value)) return min;
  const clamped = Math.min(max, Math.max(min, value));
  const digits = Math.max(decimalsOf(step), decimalsOf(min));
  const snapped = Number((min + Math.round((clamped - min) / step) * step).toFixed(digits));
  return Math.min(max, snapped);
}

/** 当前各滑块的值：单滑块一项，range 两项且已排好序 */
const values = computed<number[]>(() => {
  const raw = model.value;
  if (range) {
    const [a, b] = Array.isArray(raw) ? raw : [min, typeof raw === "number" ? raw : min];
    const lo = align(a);
    const hi = align(b);
    return [Math.min(lo, hi), Math.max(lo, hi)];
  }
  return [align(Array.isArray(raw) ? (raw[0] ?? min) : (raw ?? min))];
});

function valueAt(index: number): number {
  return values.value[index] ?? min;
}

function snapshot(): SliderValue {
  return range ? [valueAt(0), valueAt(1)] : valueAt(0);
}

/** 值在区间里的位置 0–1 */
function ratioOf(value: number): number {
  const span = max - min;
  return span > 0 ? (value - min) / span : 0;
}

/** 珠子始终整个落在轨道里：位置按"轨道宽 - 珠子宽"算，和旧版一致 */
function thumbLeft(value: number): string {
  return `calc(${ratioOf(value)} * (100% - var(--m-slider-thumb)))`;
}

/** 珠子中心到轨道左端的距离 */
function thumbCenter(value: number): string {
  return `calc(${ratioOf(value)} * (100% - var(--m-slider-thumb)) + var(--m-slider-thumb) / 2)`;
}

const trackStyle = computed(() => {
  const end = thumbCenter(valueAt(range ? 1 : 0));
  return range
    ? { left: thumbCenter(valueAt(0)), right: `calc(100% - ${end})` }
    : { left: "0", right: `calc(100% - ${end})` };
});

function tooltipText(value: number): string {
  return formatTooltip ? formatTooltip(value) : String(value);
}

/** 信息行里的百分比：旧版只显示位置百分比，保留两位小数 */
const percentText = computed(() =>
  values.value.map((v) => `${(ratioOf(v) * 100).toFixed(2)}%`).join(" ~ "),
);

/** 写入某个滑块的值；range 时两个滑块不能交叉。没变化时返回 undefined */
function setValue(index: number, raw: number): SliderValue | undefined {
  let next = align(raw);
  if (range) {
    const other = valueAt(1 - index);
    next = index === 0 ? Math.min(next, other) : Math.max(next, other);
  }
  if (next === valueAt(index)) return undefined;
  const out: SliderValue = range ? (index === 0 ? [next, valueAt(1)] : [valueAt(0), next]) : next;
  model.value = out;
  emit("input", out);
  return out;
}

function commit(value: SliderValue) {
  emit("change", value);
  formItem?.validate("change");
}

function valueFromClientX(clientX: number): number {
  const rect = rail.value?.getBoundingClientRect();
  if (!rect || rect.width <= 0) return min;
  // 珠子不越出轨道，所以可用行程是"轨道宽 - 珠子宽"，指针位置要减掉半个珠子
  const thumb = thumbEls.value?.[0]?.offsetWidth ?? 0;
  const travel = Math.max(1, rect.width - thumb);
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left - thumb / 2) / travel));
  return min + ratio * (max - min);
}

function nearestIndex(value: number): number {
  if (!range) return 0;
  const [lo, hi] = [valueAt(0), valueAt(1)];
  if (value <= lo) return 0;
  if (value >= hi) return 1;
  return value - lo <= hi - value ? 0 : 1;
}

function onPointerDown(event: PointerEvent) {
  if (disabled.value || event.button !== 0) return;
  const thumb = (event.target as Element).closest<HTMLElement>(".m-slider__thumb");
  const raw = valueFromClientX(event.clientX);
  const index = thumb ? Number(thumb.dataset.index) : nearestIndex(raw);
  event.preventDefault();
  pressedValue = snapshot();
  draggedValue = undefined;
  active.value = index;
  if (!thumb) draggedValue = setValue(index, raw);
  thumbEls.value?.[index]?.focus();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (active.value < 0) return;
  draggedValue = setValue(active.value, valueFromClientX(event.clientX)) ?? draggedValue;
}

function onPointerUp(event: PointerEvent) {
  if (active.value < 0) return;
  const el = event.currentTarget as HTMLElement;
  if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
  active.value = -1;
  if (draggedValue !== undefined && JSON.stringify(draggedValue) !== JSON.stringify(pressedValue)) {
    commit(draggedValue);
  }
  pressedValue = undefined;
  draggedValue = undefined;
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (disabled.value) return;
  const current = valueAt(index);
  let next: number;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowUp":
      next = current + step;
      break;
    case "ArrowLeft":
    case "ArrowDown":
      next = current - step;
      break;
    case "PageUp":
      next = current + step * 10;
      break;
    case "PageDown":
      next = current - step * 10;
      break;
    case "Home":
      next = min;
      break;
    case "End":
      next = max;
      break;
    default:
      return;
  }
  event.preventDefault();
  const out = setValue(index, next);
  if (out !== undefined) commit(out);
}
</script>

<template>
  <div
    class="m-slider"
    :class="{ 'm-slider--disabled': disabled, 'm-slider--range': range }"
    :style="inkStyle"
  >
    <div v-if="showInfo" class="m-slider__info">
      <span class="m-slider__min">{{ min }}</span>
      <span class="m-slider__percent">{{ percentText }}</span>
      <span class="m-slider__max">{{ max }}</span>
    </div>
    <div
      class="m-slider__body"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- 珠子放在轨道外面：轨道套了笔触遮罩，放在里面会被一起裁掉 -->
      <div ref="rail" class="m-slider__rail">
        <div class="m-slider__track" :style="trackStyle" />
      </div>
      <div
        v-for="(value, index) in values"
        :id="index === 0 ? formItem?.id.value : undefined"
        :key="index"
        ref="thumbs"
        class="m-slider__thumb"
        :class="{ 'm-slider__thumb--active': active === index }"
        :style="{ left: thumbLeft(value) }"
        :data-index="index"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="range ? (index === 0 ? '起点' : '终点') : undefined"
        :aria-valuenow="value"
        :aria-valuemin="range && index === 1 ? valueAt(0) : min"
        :aria-valuemax="range && index === 0 ? valueAt(1) : max"
        :aria-valuetext="formatTooltip ? tooltipText(value) : undefined"
        :aria-disabled="disabled || undefined"
        aria-orientation="horizontal"
        @keydown="onKeydown(index, $event)"
      >
        <div v-if="showTooltip" class="m-slider__tooltip" aria-hidden="true">
          {{ tooltipText(value) }}
        </div>
      </div>
    </div>
  </div>
</template>
