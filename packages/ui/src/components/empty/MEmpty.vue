<script setup lang="ts">
import "./empty.css";
import { computed } from "vue";
import { inkEnsoUrl } from "../../ink/assets/enso";
import { inkRidgeUrl } from "../../ink/assets/ridge";
import type { EmptyProps, EmptySlots } from "./types";

defineOptions({ name: "MEmpty" });

const {
  description = "暂无数据",
  imageSize = 120,
  image = "enso",
  seed = 1,
} = defineProps<EmptyProps>();
const slots = defineSlots<EmptySlots>();

// 素材按固定画幅生成、靠 mask 缩放到 imageSize，生成器按参数缓存：同一页面多个空状态共用一张
const style = computed(() => {
  const vars: Record<string, string> = { "--m-empty-image-size": `${imageSize}px` };
  if (slots.image) return vars;
  if (image === "enso")
    vars["--m-empty-figure"] = `url("${inkEnsoUrl({ seed, size: 128, strokeWidth: 9 })}")`;
  else if (image === "ridge")
    vars["--m-empty-figure"] =
      `url("${inkRidgeUrl({ seed, width: 320, height: 128, layers: 3, opacity: 0.5, crest: true }).url}")`;
  return vars;
});

const hasFigure = computed(() => Boolean(slots.image) || image !== "none");
</script>

<template>
  <div class="m-empty" :class="[`m-empty--${slots.image ? 'custom' : image}`]" :style="style">
    <div v-if="hasFigure" class="m-empty__image" aria-hidden="true">
      <slot name="image"><span class="m-empty__figure" /></slot>
    </div>
    <p class="m-empty__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="slots.default" class="m-empty__extra"><slot /></div>
  </div>
</template>
