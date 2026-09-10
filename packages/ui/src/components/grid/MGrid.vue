<script setup lang="ts">
import "./grid.css";
import { computed, provide, shallowRef, toRef } from "vue";
import { gridKey } from "./context";
import type { GridBreakpoint, GridProps, GridSlots } from "./types";

defineOptions({ name: "MGrid" });

const { w, h, gap, colGap, rowGap, gapRotate, direction = "row", cols } = defineProps<GridProps>();
defineSlots<GridSlots>();

/** 已登记的格子，按 DOM 顺序排好，gapRotate 靠它给每个格子定下标 */
const cells = shallowRef<HTMLElement[]>([]);

function register(el: HTMLElement) {
  if (cells.value.includes(el)) return;
  cells.value = [...cells.value, el].sort((x, y) =>
    x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}

function unregister(el: HTMLElement) {
  cells.value = cells.value.filter((cell) => cell !== el);
}

provide(gridKey, {
  w: toRef(() => w),
  h: toRef(() => h),
  direction: toRef(() => direction),
  cols: toRef(() => cols !== undefined),
  gapRotate: toRef(() => gapRotate ?? []),
  register,
  unregister,
  indexOf: (el) => cells.value.indexOf(el),
});

function toLength(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

const BREAKPOINTS: GridBreakpoint[] = ["xs", "sm", "md", "lg", "xl"];

const style = computed(() => {
  const s: Record<string, string> = {};
  // 横排 / cols 模式的主间距是 colGap，竖排是 rowGap；都没给就用 gap
  const main = direction === "row" || cols !== undefined ? colGap : rowGap;
  const mainGap = toLength(main ?? gap);
  if (mainGap !== undefined) s["--m-grid-gap"] = mainGap;
  // cols 模式会换行，行间距单独一个变量，不传时跟随主间距
  const cross = toLength(rowGap);
  if (cols !== undefined && cross !== undefined) s["--m-grid-row-gap"] = cross;
  if (typeof cols === "number") {
    s["--m-grid-cols-xs"] = String(cols);
  } else if (cols) {
    for (const bp of BREAKPOINTS) {
      const n = cols[bp];
      if (n !== undefined) s[`--m-grid-cols-${bp}`] = String(n);
    }
  }
  return s;
});
</script>

<template>
  <div
    class="m-grid"
    :class="[`m-grid--${direction}`, { 'm-grid--cols': cols !== undefined }]"
    :style="style"
  >
    <slot />
  </div>
</template>
