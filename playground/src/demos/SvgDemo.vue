<script setup lang="ts">
import { MSvg, type SvgIconName } from "@shuimo-design/ui";

const NAMES: SvgIconName[] = [
  "calendar",
  "check",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "chevrons-left",
  "chevrons-right",
  "close",
  "dot",
  "eye",
  "eye-off",
  "loading",
  "minus",
  "plus",
  "search",
];
const INK_NAMES: SvgIconName[] = [
  "check",
  "close",
  "chevron-down",
  "chevron-right",
  "dot",
  "minus",
  "plus",
];
</script>

<template>
  <div class="demo">
    <div class="demo__block">
      <p class="demo__caption">内置线性图标（跟随字号与文字颜色）</p>
      <div class="demo__row" style="font-size: 22px">
        <MSvg v-for="n in NAMES" :key="n" :name="n" :title="n" />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">ink：用笔触写出来的水墨版，没有笔触版的名字自动回落到线性版</p>
      <div class="demo__row" style="font-size: 28px">
        <MSvg v-for="n in INK_NAMES" :key="n" :name="n" ink :title="n" />
        <MSvg name="search" ink title="search（回落）" />
      </div>
      <div class="demo__row" style="font-size: 28px">
        <MSvg v-for="s in [1, 2, 3, 4, 5]" :key="s" name="check" ink :seed="s" />
        <span class="demo__hint">同一记号换 seed，每一笔都不一样</span>
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">尺寸 / 颜色 / 旋转 / 转圈</p>
      <div class="demo__row">
        <MSvg name="check" :size="16" />
        <MSvg name="check" :size="24" />
        <MSvg name="check" :size="40" />
        <MSvg name="check" size="3em" />
        <MSvg name="plus" ink :size="32" color="var(--m-accent)" />
        <MSvg name="dot" ink :size="32" color="var(--m-success)" />
        <MSvg name="chevron-right" :size="28" :rotate="90" />
        <MSvg name="chevron-right" ink :size="28" :rotate="-90" />
        <MSvg name="loading" :size="28" spin />
      </div>
    </div>

    <div class="demo__block">
      <p class="demo__caption">不传 name：默认插槽放自己的 svg，尺寸与颜色照样由外壳控制</p>
      <div class="demo__row">
        <MSvg :size="36" color="var(--m-info)" title="菱形">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 22 12 12 22 2 12Z" />
          </svg>
        </MSvg>
        <MSvg :size="36" title="双环">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </MSvg>
      </div>
    </div>

    <p class="demo__hint">
      在一段文字里 <MSvg name="check" ink /> 可以直接混排
      <MSvg name="close" />，基线与字号都跟着文字走。
    </p>
  </div>
</template>
