<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watchEffect } from "vue";
import {
  createRicePaper,
  ricePaperBaseColor,
  ricePaperClasses,
  ricePaperRidges,
  ricePaperSeed,
  ricePaperShowLandscape,
  ricePaperStyle,
  ricePaperTier,
  type RicePaperEmits,
  type RicePaperProps,
  type RicePaperSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MRicePaper" });

// 必须直接解构 defineProps：先存成变量再解构，编译出来是 setup 期的一次性快照，props 改了不会重渲染
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

/*
 * 检测特效档位、从 --m-paper-rgb 读纸色、盯 data-theme 和系统深浅偏好、量尺寸、
 * 等纹理解码完再淡入、给远山挂视差 —— 全在 core 的控制器里，React 那边用的是同一份。
 */
const { controller, state } = useController(createRicePaper, () => ({
  seed,
  tier: tierProp,
  paper,
  grain,
  fibers,
  particles,
  goldFlecks,
  deckleEdge,
  landscape,
  parallax,
  onReady: (payload) => emit("ready", payload),
}));

const resolvedSeed = computed(() => ricePaperSeed(seed, state.value.fallbackSeed));
const tier = computed(() => ricePaperTier(tierProp, state.value.detectedTier));
const baseColor = computed(() => ricePaperBaseColor(paper, state.value.themePaper));
const showLandscape = computed(() => ricePaperShowLandscape(landscape, tier.value));
const ridges = computed(() => (showLandscape.value ? ricePaperRidges(resolvedSeed.value) : []));

const rootClass = computed(() =>
  ricePaperClasses({
    ready: state.value.ready,
    deckleEdge,
    layout,
    showLandscape: showLandscape.value,
    tier: tier.value,
  }),
);
const style = computed(() =>
  ricePaperStyle({
    tier: tier.value,
    seed: resolvedSeed.value,
    baseColor: baseColor.value,
    grain,
    fibers,
    particles,
    goldFlecks,
    deckleEdge,
    width: state.value.width,
    height: state.value.height,
  }),
);

onMounted(() => {
  controller.attach(root.value);
  // 远山在 v-if / v-for 里，元素什么时候在树上只有壳知道；flush: "post" 等这一轮 DOM 更新完再告诉控制器
  watchEffect(
    () => {
      void ridges.value;
      void parallax;
      controller.sync();
    },
    { flush: "post" },
  );
});
</script>

<template>
  <div ref="root" :class="rootClass" :data-seed="resolvedSeed" :style="style">
    <div v-if="showLandscape" class="m-rice-paper__landscape" aria-hidden="true">
      <div
        v-for="ridge in ridges"
        :key="ridge.key"
        class="m-rice-paper__ridge"
        :class="ridge.className"
        :style="ridge.style"
      />
    </div>
    <div class="m-rice-paper__content"><slot /></div>
  </div>
</template>
