<script setup lang="ts">
import "./grid.css";
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { useElementSize } from "@vueuse/core";
import { brushPolygonUrl } from "../../ink/assets/polygon";
import { useBrushBorder } from "../../ink/stroke";
import { gridKey } from "./context";
import { isTilted, polygonClip, quadPoints, resolveAngles, tiltShift } from "./quad";
import type { CellProps, CellSlots } from "./types";

defineOptions({ name: "MCell" });

const { w, h, border = false, points, a, b, c, d, span, offset } = defineProps<CellProps>();
defineSlots<CellSlots>();

const root = useTemplateRef<HTMLElement>("root");
const grid = inject(gridKey, undefined);

onMounted(() => {
  if (grid && root.value) grid.register(root.value);
});
onBeforeUnmount(() => {
  if (grid && root.value) grid.unregister(root.value);
});

const index = computed(() => (grid && root.value ? grid.indexOf(root.value) : -1));
const width = computed(() => w ?? grid?.w.value);
const height = computed(() => h ?? grid?.h.value);

/** 栅格 gapRotate 分给这个格子的左右斜角：第 i 道斜缝是第 i 个格子的右边、第 i+1 个格子的左边 */
const gridTilt = computed<{ b?: number; d?: number }>(() => {
  if (!grid || grid.direction.value !== "row" || grid.cols.value || index.value < 0) return {};
  const rotate = grid.gapRotate.value;
  return { b: rotate[index.value], d: index.value > 0 ? rotate[index.value - 1] : undefined };
});
const angles = computed(() =>
  resolveAngles({ points, a, b: b ?? gridTilt.value.b, c, d: d ?? gridTilt.value.d }),
);
const tilted = computed(() => isTilted(angles.value));

const { width: measuredW, height: measuredH } = useElementSize(root, undefined, {
  box: "border-box",
});
const measured = computed(() => measuredW.value > 0 && measuredH.value > 0);
/** 斜边格子的四个角点，内容按它裁 */
const quad = computed(() =>
  tilted.value && measured.value
    ? quadPoints(measuredW.value, measuredH.value, angles.value)
    : undefined,
);

function inkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

const BRUSH = { strokeWidth: 2, seed: 7 };
// 直边格子的笔触边框交给 useBrushBorder；斜边它套不上，换成按角点生成的笔触多边形
useBrushBorder(root, {
  ...BRUSH,
  enabled: computed(() => border && !tilted.value && inkReady()),
});

/** 尺寸按 8px 分桶再生成遮罩，拖动窗口时不至于每个像素都重画一张 SVG */
function bucket(value: number): number {
  return Math.max(8, Math.ceil(value / 8) * 8);
}
const quadBorder = computed(() => {
  if (!border || !quad.value || !inkReady()) return undefined;
  const bw = bucket(measuredW.value);
  const bh = bucket(measuredH.value);
  return brushPolygonUrl(quadPoints(bw, bh, angles.value), bw, bh, BRUSH);
});

/**
 * 左边的斜角来自栅格时，往左压进去 h·tan|θ|，和前一个格子的右斜边才平行等距。
 * 这个值改的是布局，不能在尺寸回调里同步改（会触发 ResizeObserver 的循环告警），推到下一帧。
 */
const shift = shallowRef(0);
let shiftFrame: number | undefined;
watch(
  () => {
    const shared = gridTilt.value.d;
    if (shared === undefined || shared === 0 || d !== undefined || measuredH.value <= 0) return 0;
    return Math.round(tiltShift(measuredH.value, shared) * 100) / 100;
  },
  (next) => {
    if (typeof requestAnimationFrame === "undefined") {
      shift.value = next;
      return;
    }
    if (shiftFrame !== undefined) cancelAnimationFrame(shiftFrame);
    shiftFrame = requestAnimationFrame(() => {
      shiftFrame = undefined;
      shift.value = next;
    });
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  if (shiftFrame !== undefined) cancelAnimationFrame(shiftFrame);
});

const style = computed(() => {
  const s: Record<string, string> = {};
  if (width.value !== undefined) s["--m-cell-w"] = `${width.value}px`;
  if (height.value !== undefined) s["--m-cell-h"] = `${height.value}px`;
  if (shift.value !== 0) s.marginLeft = `-${shift.value}px`;
  if (span !== undefined) s.gridColumnEnd = `span ${span}`;
  if (offset !== undefined) s.gridColumnStart = String(offset + 1);
  if (quadBorder.value) {
    s["--m-cell-quad-mask"] = `url("${quadBorder.value.url}")`;
    s["--m-cell-quad-pad"] = `${quadBorder.value.padding}px`;
  }
  return s;
});

const mainStyle = computed(() => (quad.value ? { clipPath: polygonClip(quad.value) } : undefined));
const outlinePoints = computed(() =>
  quad.value
    ?.map(([x, y]) => `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`)
    .join(" "),
);
</script>

<template>
  <div
    ref="root"
    class="m-cell"
    :class="{
      'm-cell--border': border,
      'm-cell--tilted': tilted,
      'm-cell--fixed-w': width !== undefined,
      'm-cell--fixed-h': height !== undefined,
    }"
    :style="style"
  >
    <div class="m-cell__main" :style="mainStyle">
      <slot />
    </div>
    <!-- 斜边格子默认皮肤的细线轮廓；水墨模式换成 ::before 上的笔触多边形遮罩 -->
    <svg v-if="border && outlinePoints" class="m-cell__outline" aria-hidden="true">
      <polygon :points="outlinePoints" />
    </svg>
  </div>
</template>
