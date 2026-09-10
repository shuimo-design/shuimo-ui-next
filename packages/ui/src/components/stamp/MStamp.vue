<script setup lang="ts">
import "./stamp.css";
import { computed, onMounted, ref, shallowRef, useId, watch } from "vue";
import {
  createGlyphMeasurer,
  generateStamp,
  loadStampFont,
  PROBE_SIZE,
  type GlyphMeasurer,
} from "../../ink/stamp";
import type { StampProps } from "./types";

defineOptions({ name: "MStamp" });

const {
  text,
  size = 120,
  mode = "yang",
  shape = "auto",
  aspect,
  sides = 6,
  orientation = "flat-top",
  seed = 1,
  color,
  font,
  border,
  corner = "round",
  cornerRadius,
  roughness = 0.5,
  carving = 0.8,
  bleed = 0.7,
  padding,
  gap,
  rowGap,
  columnGap,
  columns,
  stretch,
  cellHeightMode = "uniform",
  offsetX = 0,
  offsetY = 0,
  direction = "ttb-rtl",
  gridLines = false,
  gridLineWidth,
  rotate = 0,
} = defineProps<StampProps>();

const id = `m-stamp-${useId()}`;
const root = ref<HTMLElement>();
const svg = ref<SVGSVGElement>();
// 字的墨迹框要等字体到了才量得准：先用兜底比例排一版，字体加载完再换成真度量重排
const measure = shallowRef<GlyphMeasurer>();

const plain = computed(() => (Array.isArray(text) ? text.join("") : text));

const render = computed(() =>
  generateStamp({
    text,
    size,
    mode,
    shape,
    aspect,
    sides,
    orientation,
    seed,
    border,
    corner,
    cornerRadius,
    roughness,
    carving,
    bleed,
    padding,
    gap,
    rowGap,
    columnGap,
    columns,
    stretch,
    cellHeightMode,
    offsetX,
    offsetY,
    direction,
    gridLines,
    gridLineWidth,
    id,
    measure: measure.value,
  }),
);

const style = computed(() => ({
  "--m-stamp-w": `${render.value.width}px`,
  "--m-stamp-h": `${render.value.height}px`,
  ...(color ? { "--m-stamp-color": color } : {}),
  ...(font ? { "--m-stamp-font": font } : {}),
  ...(rotate ? { "--m-stamp-rotate": `${rotate}deg` } : {}),
}));

let pending = 0;
async function remeasure() {
  // 必须量 svg 上生效的字体：根元素继承的是页面正文字体，拿它量出来的框对不上篆体
  const el = svg.value;
  if (!el) return;
  const family = getComputedStyle(el).fontFamily;
  const ticket = ++pending;
  await loadStampFont(family, plain.value);
  // 等待期间又改了字体 / 印文，以最后一次为准
  if (ticket !== pending) return;
  measure.value = createGlyphMeasurer(family);
}

onMounted(remeasure);
watch(() => [font, plain.value], remeasure);
</script>

<template>
  <span
    ref="root"
    class="m-stamp"
    :class="[`m-stamp--${render.mode}`, `m-stamp--${shape}`]"
    :style="style"
    role="img"
    :aria-label="render.label"
  >
    <svg
      ref="svg"
      class="m-stamp__svg"
      :width="render.width"
      :height="render.height"
      :viewBox="`0 0 ${render.width} ${render.height}`"
      aria-hidden="true"
      focusable="false"
    >
      <!-- 滤镜定义是纯数字拼的字符串，没有用户内容 -->
      <defs v-html="render.defs" />
      <template v-if="render.mode === 'yang'">
        <defs>
          <clipPath :id="render.ids.clip">
            <path :d="render.clipPath" />
          </clipPath>
        </defs>
        <g :filter="render.filters.ink">
          <g :clip-path="`url(#${render.ids.clip})`" :filter="render.filters.text">
            <text
              v-for="cell in render.cells"
              :key="`${cell.column}-${cell.row}`"
              class="m-stamp__ink m-stamp__glyph"
              x="0"
              y="0"
              :font-size="PROBE_SIZE"
              text-anchor="middle"
              :transform="cell.transform"
              v-text="cell.char"
            />
          </g>
          <path class="m-stamp__ink m-stamp__border" :d="render.borderPath" fill-rule="evenodd" />
        </g>
      </template>
      <template v-else>
        <defs>
          <!-- 亮度 mask：白底留、黑字和黑界格抠掉，抠掉的地方就是露出来的纸 -->
          <mask
            :id="render.ids.mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            :width="render.width"
            :height="render.height"
          >
            <rect x="0" y="0" :width="render.width" :height="render.height" fill="#fff" />
            <g :filter="render.filters.text">
              <text
                v-for="cell in render.cells"
                :key="`${cell.column}-${cell.row}`"
                class="m-stamp__glyph"
                x="0"
                y="0"
                :font-size="PROBE_SIZE"
                text-anchor="middle"
                fill="#000"
                :transform="cell.transform"
                v-text="cell.char"
              />
            </g>
            <g v-if="render.gridLines.length">
              <rect
                v-for="(line, i) in render.gridLines"
                :key="i"
                class="m-stamp__grid"
                :x="line.x"
                :y="line.y"
                :width="line.w"
                :height="line.h"
                fill="#000"
              />
            </g>
          </mask>
        </defs>
        <g :filter="render.filters.ink">
          <g :mask="`url(#${render.ids.mask})`">
            <path class="m-stamp__ink m-stamp__body" :d="render.borderPath" />
          </g>
        </g>
      </template>
    </svg>
  </span>
</template>
