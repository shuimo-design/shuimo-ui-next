<script setup lang="ts">
import { computed, useId, useTemplateRef, watch, watchPostEffect } from "vue";
import {
  createStampFont,
  stampClasses,
  stampId,
  stampPlainText,
  stampRender,
  stampStyle,
  type StampProps,
} from "@shuimo-design/core";
import { PROBE_SIZE } from "../../ink";
import { useController } from "../../runtime";

defineOptions({ name: "MStamp" });

const {
  text,
  size,
  mode,
  shape,
  aspect,
  sides,
  orientation,
  seed,
  color,
  font,
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
  // stretch 必须直接从 defineProps() 上解构、并显式写成 undefined：类型是 boolean，
  // Vue 会把"不传"转型成 false，而 generateStamp 对 undefined 的理解是
  // "方 / 圆 / 多边形默认撑满格子"，和显式的 false 不是一回事
  stretch = undefined,
  cellHeightMode,
  offsetX,
  offsetY,
  direction,
  gridLines,
  gridLineWidth,
  rotate,
} = defineProps<StampProps>();

/** 转型过的这份 props 才是 core 的输入；默认值归一化在 core / generateStamp 里，两个壳共用一份 */
const props = computed<StampProps>(() => ({
  text,
  size,
  mode,
  shape,
  aspect,
  sides,
  orientation,
  seed,
  color,
  font,
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
  rotate,
}));

const id = stampId(useId());
const plain = computed(() => stampPlainText(text));

// 字的墨迹框要等字体到了才量得准：控制器先给 undefined（兜底比例排一版），
// 字体加载完把真度量推过来，这里重排一次
const svg = useTemplateRef<SVGSVGElement>("svg");
const { controller: fontController, state: fontState } = useController(createStampFont, () => ({
  text: plain.value,
}));
watchPostEffect(() => fontController.attach(svg.value));
// 印文或字体族换了要重新量；等这一轮 DOM 更新完才量得到新的 font-family
watch([plain, () => font], () => fontController.refresh(), { flush: "post" });

const render = computed(() => stampRender(props.value, id, fontState.value.measure));
</script>

<template>
  <span
    :class="stampClasses(props, render)"
    :style="stampStyle(props, render)"
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
