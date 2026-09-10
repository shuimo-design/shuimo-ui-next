<script setup lang="ts">
import "./card.css";
import { computed, onMounted, useTemplateRef, watch } from "vue";
import { useElementSize } from "@vueuse/core";
import { ensureSheetAssets } from "../../ink/assets/sheet";
import { deckleMaskUrl } from "../../ink/paper";
import { registerInkVar } from "../../ink/registry";
import { useBrushBorder, type BrushBorderOptions } from "../../ink/stroke";
import { useBrushLine } from "../divider/use-brush-line";
import type { CardFrame, CardProps, CardSlots } from "./types";

defineOptions({ name: "MCard" });

const {
  title,
  shadow = "hover",
  bordered = true,
  frame = "double",
  padding = 20,
  seed = 1,
} = defineProps<CardProps>();
const slots = defineSlots<CardSlots>();

const hasHeader = computed(() => Boolean(slots.header || slots.extra || title));

function inkReady(): boolean {
  return (
    typeof document !== "undefined" && document.documentElement.classList.contains("m-ink-ready")
  );
}

/**
 * 三种框型在水墨层都是一笔画出来的框，只是粗细和笔性不同：
 * plain 细一笔、double（默认）中等一笔带轻微晕染、brush 粗一笔多飞白。
 * 没开引擎时这些参数用不上，CSS 退回单线 / 双线框。
 */
const FRAME_STROKES: Record<CardFrame, BrushBorderOptions> = {
  plain: {
    strokeWidth: 1.2,
    roughness: 0.45,
    flyingWhite: 0.08,
    wobble: 0.4,
    bleed: { scale: 1.5 },
  },
  double: { strokeWidth: 2, roughness: 0.5, flyingWhite: 0.1, wobble: 0.6, bleed: { scale: 1.8 } },
  brush: { strokeWidth: 2.6, roughness: 0.55, flyingWhite: 0.2, wobble: 0.8, bleed: true },
};

const root = useTemplateRef<HTMLElement>("root");
// 笔触参数用 getter 交出去：useBrushBorder 每次重画时才读，frame / seed 改了重画就能拿到新值
const { update: redrawBorder } = useBrushBorder(root, {
  get seed() {
    return seed;
  },
  get strokeWidth() {
    return FRAME_STROKES[frame].strokeWidth;
  },
  get roughness() {
    return FRAME_STROKES[frame].roughness;
  },
  get flyingWhite() {
    return FRAME_STROKES[frame].flyingWhite;
  },
  get wobble() {
    return FRAME_STROKES[frame].wobble;
  },
  get bleed() {
    return FRAME_STROKES[frame].bleed;
  },
  // 只在开了引擎且要边框时生成；没开引擎连 SVG 都不算，CSS 框照旧
  enabled: computed(() => bordered && inkReady()),
});
watch(
  () => [frame, seed],
  () => redrawBorder(),
);

// 头部和内容之间那条线按卡片实际宽度单独生成
const divider = useTemplateRef<HTMLElement>("divider");
useBrushLine(divider, { thickness: 1.5, seed: seed + 7, vertical: () => false });

/**
 * 纸：卡片底是一页宣纸，四边毛边。毛边遮罩按卡片尺寸生成（16px 分桶），
 * 纸比框大一圈（PAPER_OUT），撕口的深浅在 0 到十来像素之间起伏，所以纸缘大多只在框外露出两三像素，
 * 极个别地方缩到框线以内——内容区最少 12px 内边距，裁不到字。只裁纸（::after），不裁内容。
 */
const PAPER_OUT = 9;
const PAPER_BUCKET = 16;
const { width, height } = useElementSize(root, undefined, { box: "border-box" });
const paperMask = computed(() => {
  if (!inkReady() || width.value <= 0 || height.value <= 0) return "";
  const bucket = (v: number) =>
    Math.max(PAPER_BUCKET, Math.ceil((v + PAPER_OUT * 2) / PAPER_BUCKET) * PAPER_BUCKET);
  return deckleMaskUrl({
    seed: seed + 3,
    amount: 0.2,
    width: bucket(width.value),
    height: bucket(height.value),
  });
});

// 纸缘遮罩走素材登记：同尺寸的卡共用样式表里的一条规则，元素上只挂一个属性；登记不了（SSR）才内联
const paper = computed(() =>
  paperMask.value ? registerInkVar("--m-card-paper-mask", paperMask.value) : null,
);
const paperAttrs = computed(() => (paper.value ? { [paper.value.attr]: paper.value.token } : {}));
const style = computed(() => ({
  "--m-card-padding": typeof padding === "number" ? `${padding}px` : padding,
  // 遮罩还没生成时不外扩：否则会先闪一下比框大一圈的方纸
  ...(paperMask.value
    ? {
        "--m-card-paper-out": `${PAPER_OUT}px`,
        ...(paper.value ? {} : { "--m-card-paper-mask": `url("${paperMask.value}")` }),
      }
    : {}),
}));

// 纸纹和标题旁的朱批是固定素材，写到 :root 上所有卡片共用；只在开了引擎时才生成
onMounted(() => {
  if (inkReady()) ensureSheetAssets();
});
</script>

<template>
  <div
    ref="root"
    class="m-card"
    :class="[
      `m-card--${frame}`,
      `m-card--shadow-${shadow}`,
      { 'm-card--borderless': !bordered, 'm-card--with-cover': Boolean(slots.cover) },
    ]"
    :style="style"
    v-bind="paperAttrs"
  >
    <div v-if="slots.cover" class="m-card__cover">
      <slot name="cover" />
    </div>
    <div v-if="hasHeader" class="m-card__header">
      <div class="m-card__title">
        <slot name="header">{{ title }}</slot>
      </div>
      <div v-if="slots.extra" class="m-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div v-if="hasHeader" ref="divider" class="m-card__divider" aria-hidden="true" />
    <div class="m-card__body">
      <slot />
    </div>
    <div v-if="slots.footer" class="m-card__footer">
      <slot name="footer" />
    </div>
    <div v-if="slots.seal" class="m-card__seal">
      <slot name="seal" />
    </div>
  </div>
</template>
