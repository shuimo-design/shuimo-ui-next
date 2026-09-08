<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useDebounceFn, useResizeObserver } from "@vueuse/core";
import { inkWorkersKey } from "../../ink/context";
import { createLandscapeRenderer, type LandscapeRenderer } from "../../ink/landscape";
import { createPaperRenderer, type PaperRenderer } from "../../ink/paper";
import { createParallax, type ParallaxController } from "../../ink/parallax";
import { detectInkTier, type InkTier } from "../../ink/tier";
import type { RicePaperEmits, RicePaperProps, RicePaperSlots } from "./types";

defineOptions({ name: "MRicePaper" });

const {
  seed,
  tier: tierProp,
  paper,
  goldFlecks = false,
  deckleEdge = false,
  mountains = true,
  layers = 4,
  mountainsOpacity = 0.55,
  parallax: parallaxStrength = 24,
} = defineProps<RicePaperProps>();
const emit = defineEmits<RicePaperEmits>();
defineSlots<RicePaperSlots>();

const PRESETS: Record<string, [number, number, number]> = {
  raw: [255, 253, 248],
  processed: [252, 250, 240],
  antique: [245, 235, 215],
  teaStained: [240, 228, 200],
  moonWhite: [248, 250, 252],
};
const DPR_CAP = 1.5;

const root = useTemplateRef<HTMLElement>("root");
const paperCanvas = useTemplateRef<HTMLCanvasElement>("paperCanvas");
const layerCanvases = useTemplateRef<HTMLCanvasElement[]>("layerCanvases");
const workers = inject(inkWorkersKey, {});

const tier = ref<InkTier>(0);
const resolvedSeed = ref(seed ?? Math.floor(Math.random() * 2 ** 31));
const layerCount = ref(0);
const ready = ref(false);

let paperRenderer: PaperRenderer | undefined;
let landscapeRenderer: LandscapeRenderer | undefined;
let parallax: ParallaxController | undefined;
let renderToken = 0;
let mountedAt = 0;

function readThemePaper(): [number, number, number] {
  if (Array.isArray(paper)) return paper;
  if (paper && PRESETS[paper]) return PRESETS[paper]!;
  const raw = root.value ? getComputedStyle(root.value).getPropertyValue("--m-paper-rgb") : "";
  const parts = raw.trim().split(/\s+/).map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? (parts as [number, number, number])
    : PRESETS.processed!;
}

function dpr(): number {
  return Math.min(window.devicePixelRatio || 1, DPR_CAP);
}

async function render() {
  const el = root.value;
  const paperEl = paperCanvas.value;
  if (!el || !paperEl) return;
  const token = ++renderToken;
  const scale = dpr();
  const cssW = el.clientWidth;
  const cssH = el.clientHeight;
  if (cssW === 0 || cssH === 0) return;
  const width = Math.round(cssW * scale);
  const height = Math.round(cssH * scale);
  let polylines = 0;

  if (tier.value === 0) {
    // 纯色纸：不起 worker
    paperEl.width = width;
    paperEl.height = height;
    const ctx = paperEl.getContext("2d");
    if (ctx) {
      const [r, g, b] = readThemePaper();
      ctx.fillStyle = `rgb(${r} ${g} ${b})`;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    paperRenderer ??= createPaperRenderer(workers.paper ? { createWorker: workers.paper } : {});
    const paperJob = paperRenderer.render(width, height, {
      seed: resolvedSeed.value,
      baseColor: readThemePaper(),
      goldFlecks,
      deckleEdge,
    });

    // 远山画幅比容器宽出视差位移，避免移动时露边
    const overscan = Math.round(parallaxStrength * scale);
    const landscapeJob =
      mountains && layers > 0
        ? (landscapeRenderer ??= createLandscapeRenderer(
            workers.landscape ? { createWorker: workers.landscape } : {},
          )).render(width + overscan * 2, height + overscan * 2, {
            seed: resolvedSeed.value,
            layers,
          })
        : undefined;

    const paperBitmap = await paperJob;
    if (token !== renderToken) {
      paperBitmap.close();
      return;
    }
    paperEl.width = width;
    paperEl.height = height;
    paperEl.getContext("2d")?.drawImage(paperBitmap, 0, 0);
    paperBitmap.close();

    if (landscapeJob) {
      const result = await landscapeJob;
      if (token !== renderToken) {
        for (const layer of result.layers) layer.bitmap.close();
        return;
      }
      polylines = result.polylines;
      layerCount.value = result.layers.length;
      // 等 v-for 把 canvas 渲染出来
      await Promise.resolve();
      const canvases = layerCanvases.value ?? [];
      result.layers.forEach((layer, index) => {
        const canvas = canvases[index];
        if (!canvas) return;
        canvas.width = layer.bitmap.width;
        canvas.height = layer.bitmap.height;
        canvas.style.left = `${-overscan / scale}px`;
        canvas.style.top = `${-overscan / scale}px`;
        canvas.style.width = `${layer.bitmap.width / scale}px`;
        canvas.style.height = `${layer.bitmap.height / scale}px`;
        canvas.getContext("2d")?.drawImage(layer.bitmap, 0, 0);
        layer.bitmap.close();
      });
      if (parallaxStrength > 0) {
        parallax ??= createParallax({ strength: parallaxStrength, pointerTarget: el });
        parallax.setLayers(
          result.layers.map((layer, index) => ({ element: canvases[index]!, depth: layer.depth })),
        );
      }
    }
  }

  if (!ready.value) {
    ready.value = true;
    emit("ready", {
      seed: resolvedSeed.value,
      tier: tier.value,
      polylines,
      ms: Math.round(performance.now() - mountedAt),
    });
  }
}

const rerender = useDebounceFn(render, 300);

onMounted(() => {
  mountedAt = performance.now();
  tier.value = tierProp ?? detectInkTier();
  void render();
  useResizeObserver(root, () => {
    if (ready.value) void rerender();
  });
});

watch(
  () => [seed, tierProp, paper, goldFlecks, deckleEdge, mountains, layers] as const,
  () => {
    if (seed !== undefined) resolvedSeed.value = seed;
    if (tierProp !== undefined) tier.value = tierProp;
    void render();
  },
);

onBeforeUnmount(() => {
  renderToken++;
  parallax?.dispose();
  paperRenderer?.dispose();
  landscapeRenderer?.dispose();
});
</script>

<template>
  <div
    ref="root"
    class="m-rice-paper"
    :class="{ 'm-rice-paper--ready': ready, [`m-rice-paper--tier-${tier}`]: true }"
    :data-seed="resolvedSeed"
  >
    <canvas ref="paperCanvas" class="m-rice-paper__paper" aria-hidden="true"></canvas>
    <div
      v-if="layerCount > 0"
      class="m-rice-paper__mountains"
      :style="{ opacity: mountainsOpacity }"
      aria-hidden="true"
    >
      <canvas
        v-for="index in layerCount"
        :key="index"
        ref="layerCanvases"
        class="m-rice-paper__layer"
        :style="{ '--m-layer-index': index - 1 }"
      ></canvas>
    </div>
    <div class="m-rice-paper__content"><slot /></div>
  </div>
</template>
