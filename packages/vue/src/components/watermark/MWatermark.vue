<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watch } from "vue";
import {
  createWatermark,
  resolveWatermark,
  watermarkClasses,
  watermarkStyle,
  WATERMARK_LAYER_CLASS,
  type WatermarkProps,
  type WatermarkSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

defineOptions({ name: "MWatermark" });

// 必须直接解构 defineProps：先存成变量再解构，编译出来是 setup 期的一次性快照，props 改了不会重渲染
// ink 是布尔 prop，Vue 会把没传当 false，默认值要在这里显式给
const {
  content,
  image,
  font,
  rotate,
  gap,
  offset,
  width,
  height,
  zIndex,
  ink = true,
  seed,
} = defineProps<WatermarkProps>();
defineSlots<WatermarkSlots>();

const root = useTemplateRef<HTMLElement>("root");
const layer = useTemplateRef<HTMLElement>("layer");

// 归一化和 SVG 生成都是纯函数，服务端和客户端首帧算出同一张图
const resolved = computed(() =>
  resolveWatermark({ content, image, font, rotate, gap, offset, width, height, zIndex, ink, seed }),
);
const classes = computed(() =>
  watermarkClasses({ image: resolved.value.image !== undefined, ink: resolved.value.ink }),
);
const layerStyle = computed(() => watermarkStyle(resolved.value));

// 防篡改：水印层被删、被改样式就贴回去，观察器在 core 的控制器里，React 那边用的是同一份
const { controller } = useController(createWatermark, () => ({ style: layerStyle.value }));

onMounted(() => {
  watch(
    [root, layer],
    () => {
      controller.attach(root.value);
      controller.setLayer(layer.value);
    },
    { immediate: true, flush: "post" },
  );
});
</script>

<template>
  <div ref="root" :class="classes">
    <slot />
    <div ref="layer" :class="WATERMARK_LAYER_CLASS" :style="layerStyle" aria-hidden="true" />
  </div>
</template>
