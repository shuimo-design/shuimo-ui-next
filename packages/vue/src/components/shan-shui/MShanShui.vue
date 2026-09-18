<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watchEffect } from "vue";
import {
  createShanShui,
  SHAN_SHUI_HEIGHT,
  SHAN_SHUI_SEED,
  shanShuiClasses,
  shanShuiLayers,
  shanShuiParallaxMode,
  shanShuiScene,
  shanShuiStyle,
  shanShuiTier,
  type ShanShuiEmits,
  type ShanShuiProps,
  type ShanShuiSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MShanShui" });

// 必须直接解构 defineProps：先存成变量再解构，编译出来是 setup 期的一次性快照，props 改了不会重渲染
const {
  seed = SHAN_SHUI_SEED,
  tier: tierProp,
  height = SHAN_SHUI_HEIGHT,
  layers: layersProp = 3,
  sun = true,
  geese = true,
  boat = true,
  parallax: parallaxProp = "scroll",
  palette = "ink",
} = defineProps<ShanShuiProps>();
const emit = defineEmits<ShanShuiEmits>();
defineSlots<ShanShuiSlots>();

const root = useTemplateRef<HTMLElement>("root");
const layers = computed(() => shanShuiLayers(layersProp));

// 检测特效档位、等遮罩图解码完再淡入、给图层挂视差 —— 全在 core 的控制器里，React 那边用的是同一份
const { controller, state } = useController(createShanShui, () => ({
  seed,
  tier: tierProp,
  layers: layers.value,
  sun,
  geese,
  boat,
  parallax: parallaxProp,
  onReady: (payload) => emit("ready", payload),
}));

const tier = computed(() => shanShuiTier(tierProp, state.value.detectedTier));
const parallax = computed(() => shanShuiParallaxMode(parallaxProp, tier.value));
const scene = computed(() =>
  shanShuiScene({ seed, tier: tier.value, layers: layers.value, sun, geese, boat }),
);
const rootClass = computed(() =>
  shanShuiClasses({
    ready: state.value.ready,
    palette,
    parallax: parallax.value,
    tier: tier.value,
  }),
);
const style = computed(() => shanShuiStyle({ height }));

onMounted(() => {
  controller.attach(root.value);
  // 图层在 v-for 里，元素什么时候在树上只有壳知道；flush: "post" 等这一轮 DOM 更新完再告诉控制器
  watchEffect(
    () => {
      void scene.value;
      void parallax.value;
      controller.sync();
    },
    { flush: "post" },
  );
});
</script>

<template>
  <div ref="root" :class="rootClass" :style="style" :data-seed="seed">
    <div class="m-shan-shui__scene" aria-hidden="true">
      <div
        v-for="layer in scene"
        :key="layer.key"
        class="m-shan-shui__layer"
        :class="`m-shan-shui__${layer.kind}`"
        :data-depth="layer.depth"
        :style="layer.style"
      />
    </div>
    <div class="m-shan-shui__content"><slot /></div>
  </div>
</template>
