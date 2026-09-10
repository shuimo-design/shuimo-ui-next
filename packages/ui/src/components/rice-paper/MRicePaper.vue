<script setup lang="ts">
import "./rice-paper.css";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useElementSize } from "@vueuse/core";
import { inkRidgeUrl } from "../../ink/assets/ridge";
import { deckleMaskUrl, goldFleckUrl, PAPER_PRESETS, paperTextureUrl } from "../../ink/paper";
import { createParallax, type ParallaxController } from "../../ink/parallax";
import { detectInkTier, type InkTier } from "../../ink/tier";
import type { RicePaperEmits, RicePaperProps, RicePaperSlots } from "./types";

defineOptions({ name: "MRicePaper" });

const {
  seed,
  tier: tierProp,
  paper,
  grain = 0.5,
  goldFlecks = false,
  fibers = 1,
  particles = 0.5,
  deckleEdge = false,
  landscape = true,
  parallax = true,
  layout = "auto",
} = defineProps<RicePaperProps>();
const emit = defineEmits<RicePaperEmits>();
defineSlots<RicePaperSlots>();

const root = useTemplateRef<HTMLElement>("root");
const tier = ref<InkTier>(0);
const resolvedSeed = ref(seed ?? Math.floor(Math.random() * 2 ** 31));
const ready = ref(false);
/** 主题给的纸色，挂载后从 --m-paper-rgb 读，主题切换时刷新 */
const themePaper = ref<[number, number, number]>(PAPER_PRESETS.processed);
let mountedAt = 0;
let observer: MutationObserver | undefined;
let media: MediaQueryList | undefined;

const baseColor = computed<[number, number, number]>(() => {
  if (Array.isArray(paper)) return paper;
  if (paper) return PAPER_PRESETS[paper];
  return themePaper.value;
});

const textureUrl = computed(() =>
  tier.value > 0
    ? paperTextureUrl({
        seed: resolvedSeed.value,
        baseColor: baseColor.value,
        grain,
        fibers,
        particles,
      })
    : "",
);
// 洒金单独一层、平铺单元更大（768），金簇不会每 384px 重复一次
const goldUrl = computed(() => {
  if (!goldFlecks || tier.value === 0) return "";
  const options = typeof goldFlecks === "object" ? goldFlecks : {};
  return goldFleckUrl({ ...options, seed: resolvedSeed.value });
});
// 毛边遮罩按元素实际尺寸生成（32px 分桶），纤维才是真实像素尺度；量到尺寸之前先不套。
// ResizeObserver 的回调跟着渲染帧走，页面在后台标签里打开时一帧都不跑、尺寸一直是 0，
// 所以挂载时先用 getBoundingClientRect 量一次兜底，之后再由 ResizeObserver 接管
const { width: rootWidth, height: rootHeight } = useElementSize(root, undefined, {
  box: "border-box",
});
const mountedSize = ref({ width: 0, height: 0 });
const MASK_BUCKET = 32;
const maskUrl = computed(() => {
  const width = rootWidth.value || mountedSize.value.width;
  const height = rootHeight.value || mountedSize.value.height;
  if (!deckleEdge || width <= 0 || height <= 0) return "";
  const bucket = (v: number) => Math.max(MASK_BUCKET, Math.ceil(v / MASK_BUCKET) * MASK_BUCKET);
  return deckleMaskUrl({ seed: resolvedSeed.value, width: bucket(width), height: bucket(height) });
});

const style = computed(() => ({
  "--m-rice-paper-rgb": baseColor.value.join(" "),
  "--m-rice-paper-texture": textureUrl.value ? `url("${textureUrl.value}")` : "none",
  "--m-rice-paper-gold": goldUrl.value ? `url("${goldUrl.value}")` : "none",
  "--m-rice-paper-mask": maskUrl.value ? `url("${maskUrl.value}")` : "none",
}));

/**
 * 远山版式：左右各一远一近，共四张，和旧站 4096 宽那套 webp 的占位对齐（宽度、贴边位置都是容器宽度的百分比）。
 * 远层贴着容器外沿放（切口藏在外面），近层往里挪一点并把外沿化开；depth 是视差里的层深。
 */
interface RidgeSpec {
  side: "left" | "right";
  depth: number;
  width: number;
  inset: number;
  ratio: number;
  range: [number, number];
  opacity: number;
  soft: boolean;
}
const RIDGES: readonly RidgeSpec[] = [
  {
    side: "left",
    depth: 0.3,
    width: 46,
    inset: -2,
    ratio: 3,
    range: [0, 0.45],
    opacity: 0.85,
    soft: false,
  },
  {
    side: "left",
    depth: 1,
    width: 30,
    inset: 5,
    ratio: 2.3,
    range: [0.6, 1],
    opacity: 1,
    soft: true,
  },
  {
    side: "right",
    depth: 0.3,
    width: 56,
    inset: -2,
    ratio: 2.9,
    range: [0, 0.45],
    opacity: 0.85,
    soft: false,
  },
  {
    side: "right",
    depth: 1,
    width: 32,
    inset: 6,
    ratio: 2.4,
    range: [0.6, 1],
    opacity: 1,
    soft: true,
  },
];

const showLandscape = computed(() => landscape && tier.value > 0);
const ridges = computed(() => {
  if (!showLandscape.value) return [];
  return RIDGES.map((spec, index) => {
    const ridge = inkRidgeUrl({
      seed: resolvedSeed.value + index + 1,
      width: 1200,
      height: Math.round(1200 / spec.ratio),
      layers: 2,
      opacity: spec.opacity,
      side: spec.side,
      crest: true,
      depthRange: spec.range,
      softOuter: spec.soft,
    });
    return {
      key: index,
      class: `m-rice-paper__ridge--${spec.side} m-rice-paper__ridge--${spec.depth < 0.5 ? "far" : "near"}`,
      style: {
        [spec.side]: `${spec.inset}%`,
        width: `${spec.width}%`,
        aspectRatio: `${ridge.width} / ${ridge.height}`,
        "--m-rice-paper-ridge": `url("${ridge.url}")`,
        "--m-rice-paper-ridge-silhouette": `url("${ridge.silhouette}")`,
      },
    };
  });
});

let controller: ParallaxController | undefined;
function syncParallax() {
  controller?.dispose();
  controller = undefined;
  if (!showLandscape.value || !parallax || !root.value) return;
  const elements = Array.from(root.value.querySelectorAll<HTMLElement>(".m-rice-paper__ridge"));
  if (elements.length === 0) return;
  // 旧版：横向最多 ±5px、纵向再减半；这里近层 ±8px，滚动联动压得很轻，整站背景不能晃
  controller = createParallax({ strength: 8, damping: 0.08, scrollFactor: 0.02 });
  controller.setLayers(
    elements.map((element, index) => ({ element, depth: RIDGES[index]?.depth ?? 1 })),
  );
}

function readThemePaper() {
  const el = root.value;
  if (!el) return;
  const parts = getComputedStyle(el).getPropertyValue("--m-paper-rgb").trim().split(/\s+/);
  const rgb = parts.map(Number);
  if (rgb.length === 3 && rgb.every(Number.isFinite)) {
    themePaper.value = rgb as [number, number, number];
  }
}

async function settle() {
  const url = textureUrl.value;
  const gold = goldUrl.value;
  // 等纹理（和洒金）解码完再淡入，避免先闪一下平色
  await Promise.all(
    [url, gold].filter(Boolean).map(async (src) => {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
      } catch {
        // 解码失败就直接显示，纸色还在
      }
    }),
  );
  if (url !== textureUrl.value || gold !== goldUrl.value) return;
  if (!ready.value) {
    ready.value = true;
    emit("ready", {
      seed: resolvedSeed.value,
      tier: tier.value,
      ms: Math.round(performance.now() - mountedAt),
    });
  }
}

onMounted(() => {
  mountedAt = performance.now();
  const rect = root.value?.getBoundingClientRect();
  if (rect) mountedSize.value = { width: rect.width, height: rect.height };
  tier.value = tierProp ?? detectInkTier();
  readThemePaper();
  void settle();
  observer = new MutationObserver(readThemePaper);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // 只有 data-theme="system" 时纸色才会随系统变
  media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", readThemePaper);
  // 远山元素在 v-if / v-for 里，immediate 的首次回调是同步跑的，DOM 还没落地：统一等下一个 tick 再挂视差
  watch([showLandscape, () => parallax], () => void nextTick(syncParallax), { immediate: true });
});

watch(
  () => [seed, tierProp] as const,
  () => {
    if (seed !== undefined) resolvedSeed.value = seed;
    if (tierProp !== undefined) tier.value = tierProp;
  },
);

onBeforeUnmount(() => {
  observer?.disconnect();
  media?.removeEventListener("change", readThemePaper);
  controller?.dispose();
  controller = undefined;
});
</script>

<template>
  <div
    ref="root"
    class="m-rice-paper"
    :class="{
      'm-rice-paper--ready': ready,
      'm-rice-paper--deckle': deckleEdge,
      'm-rice-paper--full-screen': layout === 'full-screen',
      'm-rice-paper--landscape': showLandscape,
      [`m-rice-paper--tier-${tier}`]: true,
    }"
    :data-seed="resolvedSeed"
    :style="style"
  >
    <div v-if="showLandscape" class="m-rice-paper__landscape" aria-hidden="true">
      <div
        v-for="ridge in ridges"
        :key="ridge.key"
        class="m-rice-paper__ridge"
        :class="ridge.class"
        :style="ridge.style"
      />
    </div>
    <div class="m-rice-paper__content"><slot /></div>
  </div>
</template>
