<script setup lang="ts" generic="T">
import "./virtual-list.css";
import { computed, onBeforeUnmount, shallowRef, watch, type Directive } from "vue";
import { useElementSize } from "@vueuse/core";
import { brushLineUrl } from "../../ink/assets/line";
import { inkVarBindings } from "../../ink/registry";
import type {
  VirtualListAlign,
  VirtualListEmits,
  VirtualListExpose,
  VirtualListProps,
  VirtualListSlots,
} from "./types";

defineOptions({ name: "MVirtualList" });

const {
  list,
  itemHeight,
  estimatedItemHeight = 40,
  buffer = 5,
  height,
  itemKey,
  divider = false,
} = defineProps<VirtualListProps<T>>();
const emit = defineEmits<VirtualListEmits>();
defineSlots<VirtualListSlots<T>>();

const items = computed(() => list ?? []);
const total = computed(() => items.value.length);

const viewport = shallowRef<HTMLElement | null>(null);
const { width: viewportWidth, height: viewportHeight } = useElementSize(viewport);
const scrollTop = shallowRef(0);

/** 变高模式下量到的高度，下标 → px；没量过的用估算值 */
let measured = new Map<number, number>();
/** measured 变了就 +1，让依赖它的 computed 重算（Map 本身不做响应式，量尺寸时改动很频繁） */
const version = shallowRef(0);

function heightOf(index: number): number {
  if (itemHeight !== undefined) return itemHeight;
  return measured.get(index) ?? estimatedItemHeight;
}

/** 前缀和：offsets[i] 是第 i 项的顶边，offsets[n] 是总高 */
const offsets = computed<number[]>(() => {
  void version.value;
  const n = total.value;
  const result: number[] = [0];
  if (itemHeight !== undefined) {
    for (let i = 0; i < n; i++) result.push((i + 1) * itemHeight);
  } else {
    for (let i = 0; i < n; i++) result.push(result[i]! + heightOf(i));
  }
  return result;
});
const totalHeight = computed(() => offsets.value[total.value] ?? 0);

/** 顶边 ≤ top 的最后一项 */
function indexAt(top: number): number {
  const list = offsets.value;
  let lo = 0;
  let hi = total.value - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (list[mid]! <= top) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** 要渲染的区间 [start, end)，含上下缓冲 */
const range = computed(() => {
  const n = total.value;
  if (n === 0) return { start: 0, end: 0 };
  // 容器还没量出高度时（首帧）先按估算渲染一屏，免得空白一帧
  const vh = viewportHeight.value || 300;
  const top = scrollTop.value;
  const first = indexAt(top);
  let last = first;
  while (last < n - 1 && offsets.value[last + 1]! < top + vh) last++;
  return { start: Math.max(0, first - buffer), end: Math.min(n, last + 1 + buffer) };
});

const visible = computed(() =>
  items.value.slice(range.value.start, range.value.end).map((data, i) => ({
    data,
    index: range.value.start + i,
  })),
);

function keyOf(data: T, index: number): PropertyKey {
  return itemKey ? itemKey(data, index) : index;
}

const bodyStyle = computed(() => ({
  transform: `translateY(${offsets.value[range.value.start] ?? 0}px)`,
}));

/** 到底只报一次，离开底部后再回来才再报 */
let atBottom = false;

function checkBottom() {
  const el = viewport.value;
  if (!el || total.value === 0) return;
  const reached = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  if (reached && !atBottom) emit("reachBottom");
  atBottom = reached;
}

function onScroll() {
  const el = viewport.value;
  if (!el) return;
  scrollTop.value = el.scrollTop;
  emit("scroll", el.scrollTop);
  checkBottom();
}

/* ---------- 变高模式：量尺寸 ---------- */

/** 定高模式不量；SSR 没有 ResizeObserver 也不量 */
const observer =
  itemHeight === undefined && typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(measure)
    : undefined;

function itemIndex(el: Element): number {
  return Number((el as HTMLElement).dataset.index);
}

function measure(entries: ResizeObserverEntry[]) {
  let changed = false;
  // 可视区上方的项变高变矮会把内容顶着走，按差值补 scrollTop 让眼前的内容不跳
  let shift = 0;
  const start = range.value.start;
  const firstVisible = indexAt(scrollTop.value);
  for (const entry of entries) {
    const index = itemIndex(entry.target);
    if (!Number.isFinite(index)) continue;
    const size = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
    if (size <= 0) continue;
    const prev = measured.get(index);
    if (prev === size) continue;
    measured.set(index, size);
    changed = true;
    if (index >= start && index < firstVisible) shift += size - (prev ?? estimatedItemHeight);
  }
  if (!changed) return;
  version.value++;
  if (shift !== 0 && viewport.value) viewport.value.scrollTop += shift;
}

/**
 * 新挂上的项攒到下一帧再 observe，卸掉的项立刻 unobserve。
 * 量尺寸的回调里会改状态、重渲染；要是在同一轮里 observe 新节点、或让已观察的节点被移除，
 * 浏览器都会报 "ResizeObserver loop completed with undelivered notifications"。
 */
const pendingObserve = new Set<HTMLElement>();
let observeFrame: number | undefined;

function flushObserve() {
  observeFrame = undefined;
  if (!observer) return;
  for (const el of pendingObserve) observer.observe(el);
  pendingObserve.clear();
}

const vMeasure: Directive<HTMLElement> = {
  mounted(el) {
    if (!observer) return;
    pendingObserve.add(el);
    if (observeFrame === undefined) observeFrame = requestAnimationFrame(flushObserve);
  },
  beforeUnmount(el) {
    pendingObserve.delete(el);
    observer?.unobserve(el);
  },
};

onBeforeUnmount(() => {
  if (observeFrame !== undefined) cancelAnimationFrame(observeFrame);
  observer?.disconnect();
});

// 换了一份数据，旧的高度就不可信了；只是追加则保留量过的部分
watch(
  () => items.value,
  (next, prev) => {
    if (
      prev &&
      next.length >= prev.length &&
      next.slice(0, prev.length).every((v, i) => v === prev[i])
    ) {
      return;
    }
    measured = new Map();
    version.value++;
    atBottom = false;
  },
);

/* ---------- 对外方法 ---------- */

function targetTop(index: number, align: Exclude<VirtualListAlign, "auto">): number {
  const el = viewport.value;
  const top = offsets.value[index] ?? 0;
  const size = heightOf(index);
  const vh = el?.clientHeight ?? 0;
  switch (align) {
    case "start":
      return top;
    case "center":
      return top - (vh - size) / 2;
    default:
      return top + size - vh;
  }
}

function scrollToOffset(top: number) {
  const el = viewport.value;
  if (!el) return;
  el.scrollTop = Math.max(0, top);
  // scroll 事件是异步的，先把状态对上，调用方 nextTick 后就能拿到新的一批项
  scrollTop.value = el.scrollTop;
}

function scrollTo(index: number, align: VirtualListAlign = "auto") {
  const el = viewport.value;
  const n = total.value;
  if (!el || n === 0) return;
  const target = Math.max(0, Math.min(n - 1, Math.floor(index)));
  let effective: Exclude<VirtualListAlign, "auto"> = align === "auto" ? "start" : align;
  if (align === "auto") {
    // 已经整个在可视区里就不动；在上面就贴顶，在下面就贴底
    const top = offsets.value[target] ?? 0;
    if (top >= el.scrollTop && top + heightOf(target) <= el.scrollTop + el.clientHeight) return;
    effective = top < el.scrollTop ? "start" : "end";
  }
  const go = () => {
    const top = targetTop(target, effective);
    if (Math.abs(top - (viewport.value?.scrollTop ?? 0)) > 1) scrollToOffset(top);
  };
  go();
  // 变高模式：滚过去之后那一批项才被量到（观察推迟了一帧），位置会挪，接着几帧再校正
  if (itemHeight === undefined) {
    let rounds = 3;
    const settle = () => {
      go();
      if (--rounds > 0) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
  }
}

defineExpose<VirtualListExpose>({
  scrollTo,
  scrollToOffset,
  scrollTop: () => viewport.value?.scrollTop ?? 0,
});

// 分隔线：一根按列表实际宽度生成的细笔触线，宽度按 32px 分桶，所有项共用同一张（m.ink 层用它当遮罩）；
// 量到宽度前不给变量，CSS 里回落到通用横线
const LINE_SEED = 5;
const WIDTH_BUCKET = 32;
const line = computed(() => {
  if (!divider || viewportWidth.value <= 0) return undefined;
  const length = Math.max(
    WIDTH_BUCKET,
    Math.ceil(viewportWidth.value / WIDTH_BUCKET) * WIDTH_BUCKET,
  );
  return brushLineUrl({ seed: LINE_SEED, length, thickness: 1.5, roughness: 0.4 });
});
// 线走素材登记：同宽度桶的列表共用样式表里的一条规则，元素上只挂属性；登记不了（SSR）才内联
const ink = computed(() => inkVarBindings({ "--m-virtual-list-line": line.value?.url }));
const rootStyle = computed(() => {
  const style: Record<string, string> = { ...ink.value.style };
  if (height !== undefined)
    style["--m-virtual-list-h"] = typeof height === "number" ? `${height}px` : height;
  if (line.value) style["--m-virtual-list-line-band"] = `${line.value.height}px`;
  return style;
});
</script>

<template>
  <div
    ref="viewport"
    class="m-virtual-list"
    :class="{ 'm-virtual-list--divider': divider }"
    :style="rootStyle"
    v-bind="ink.attrs"
    @scroll.passive="onScroll"
  >
    <!-- 占位层撑出总高度让滚动条正确，可见的那批项由 body 平移到位 -->
    <div class="m-virtual-list__phantom" :style="{ height: `${totalHeight}px` }" />
    <div class="m-virtual-list__body" :style="bodyStyle">
      <template v-for="{ data, index } in visible" :key="keyOf(data, index)">
        <!-- 分隔线是项之间一个零高的元素，线画在它的伪元素上、骑在两项的交界线上：
             不占高度（占了会让首项和其余项差 1px），也不受定高项 overflow: hidden 的裁切 -->
        <div v-if="divider && index > 0" class="m-virtual-list__divider" aria-hidden="true" />
        <div
          v-measure
          class="m-virtual-list__item"
          :data-index="index"
          :style="itemHeight !== undefined ? { height: `${itemHeight}px` } : undefined"
        >
          <slot :data="data" :index="index" />
        </div>
      </template>
    </div>
  </div>
</template>
