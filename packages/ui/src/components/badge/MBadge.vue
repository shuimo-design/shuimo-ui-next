<script setup lang="ts">
import "./badge.css";
import { computed, ref, watch } from "vue";
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkPasteUrl } from "../../ink/assets/paste";
import { inkShapeUrl } from "../../ink/assets/shape";
import { inkVarBindings } from "../../ink/registry";
import type { BadgeProps, BadgeSlots } from "./types";

defineOptions({ name: "MBadge" });

const {
  value,
  max = 99,
  dot = false,
  hidden = false,
  type = "danger",
  offset,
  showZero = false,
  seed = 1,
} = defineProps<BadgeProps>();
const slots = defineSlots<BadgeSlots>();

const content = computed(() => {
  if (dot || value === undefined) return "";
  if (typeof value === "number") return value > max ? `${max}+` : String(value);
  return value;
});

const visible = computed(() => {
  if (hidden) return false;
  if (dot) return true;
  if (value === undefined || value === "") return false;
  return value !== 0 || showZero;
});

// 数字变了就换个 key 让 sup 重挂一次，CSS 动画随之重播；首次挂载不弹
const bump = ref(0);
watch(content, () => {
  bump.value += 1;
});

// 印面外形按内容估宽分桶（1 位数是方印，2 位、"99+"、短文字依次加宽），不去量 DOM：
// sup 每次变值都重挂，量完再出形会先闪一帧方块。估的宽只决定外形长宽比，
// 遮罩最终拉到 ::after 的实际盒子上，差几个像素看不出来；inkShapeUrl 再按 8px 分桶缓存
const SEAL_HEIGHT = 20;
function sealWidth(text: string): number {
  let width = 10;
  // 12px 字号下数字和拉丁字母约 7px 宽，汉字约 12px
  for (const ch of text) width += /[\u2e80-\uffff]/.test(ch) ? 12 : 7;
  return Math.max(SEAL_HEIGHT, width);
}
const shape = computed(() => {
  if (dot || !content.value) return undefined;
  const width = sealWidth(content.value);
  // 每档宽度换一个种子，同一页里 1 位数和 2 位数的印不会是同一枚拉宽
  return inkShapeUrl(width, SEAL_HEIGHT, {
    seed: seed * 5 + Math.round(width / 8),
    raggedness: 0.6,
    corner: 0.1,
  });
});
// 小点：一滴洇开的朱砂，毛边和晕染都让生成器带上
const dotMask = computed(() =>
  dot
    ? inkBlobUrl({ seed: seed + 2, size: 24, radius: 0.42, raggedness: 0.24, bleed: 1.3 })
    : undefined,
);
// 印泥厚薄纹理，和外形遮罩 intersect
const paste = computed(() => inkPasteUrl({ seed }));

// 三张遮罩走素材登记：外形按字数分桶、小点和印泥按种子固定，同一张图在样式表里只写一次，
// 元素上只挂属性；登记不了（SSR）才内联
const ink = computed(() =>
  inkVarBindings({
    "--m-badge-shape": shape.value?.url,
    "--m-badge-dot": dotMask.value,
    "--m-badge-paste": paste.value.url,
  }),
);
const style = computed(() => ({
  ...(offset
    ? { "--m-badge-offset-x": `${offset[0]}px`, "--m-badge-offset-y": `${offset[1]}px` }
    : {}),
  ...ink.value.style,
  "--m-badge-shape-pad": shape.value ? `${shape.value.padding}px` : undefined,
  "--m-badge-paste-size": `${paste.value.size}px`,
}));
</script>

<template>
  <span
    class="m-badge"
    :class="[`m-badge--${type}`, { 'm-badge--dot': dot, 'm-badge--standalone': !slots.default }]"
    :style="style"
    v-bind="ink.attrs"
  >
    <slot />
    <sup
      v-if="visible"
      :key="bump"
      class="m-badge__sup"
      :class="{ 'm-badge__sup--bump': bump > 0 }"
      :aria-hidden="dot ? 'true' : undefined"
      >{{ content }}</sup
    >
  </span>
</template>
