<script setup lang="ts" generic="Range extends boolean = false">
import { computed } from "vue";
import {
  createSlider,
  sliderClasses,
  sliderInkStyle,
  sliderPercentText,
  sliderTabIndex,
  sliderThumbAria,
  sliderThumbLeft,
  sliderTooltipText,
  sliderTrackStyle,
  sliderValues,
  type SliderEmits,
  type SliderProps,
  type SliderModel,
  type SliderValue,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { unboundModel } from "../../internal/model";
import { useController } from "../../runtime";

defineOptions({ name: "MSlider" });

const {
  min = 0,
  max = 100,
  step = 1,
  disabled: disabledProp = false,
  // 默认单滑块，Range 默认也是 false；写了 range 就推成 true，v-model 跟着变成 [起, 止]
  range = false as Range,
  showInfo = false,
  showTooltip = true,
  formatTooltip,
} = defineProps<SliderProps<Range>>();
const emit = defineEmits<SliderEmits<Range>>();
/** 滑块的值；range 模式下是 [起, 止] */
const model = defineModel<SliderModel<Range>>({ default: unboundModel });

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const geometry = computed(() => ({ min, max, step, range }));
/** 当前各把手的值：单把手一项，range 两项且已排好序 */
const values = computed(() => sliderValues(model.value, geometry.value));

// 步长对齐、按坐标折算值、最近把手、七个键的增减、拖拽状态全在 core 的控制器里，
// 和 React 那边是同一份
const { controller: slider, state } = useController(createSlider, () => ({
  ...geometry.value,
  disabled: disabled.value,
  values: values.value,
  // 控制器给的是两种形状的并集，按本组件的 Range 收窄一次
  onInput: (value: SliderValue) => {
    model.value = value as SliderModel<Range>;
    emit("input", value as SliderModel<Range>);
  },
  onChange: (value: SliderValue) => {
    emit("change", value as SliderModel<Range>);
    formItem.value.validate("change");
  },
}));

const inkStyle = sliderInkStyle();
</script>

<template>
  <div :class="sliderClasses({ disabled, range })" :style="inkStyle">
    <div v-if="showInfo" class="m-slider__info">
      <span class="m-slider__min">{{ min }}</span>
      <span class="m-slider__percent">{{ sliderPercentText(values, geometry) }}</span>
      <span class="m-slider__max">{{ max }}</span>
    </div>
    <div
      :ref="(el) => slider.setBody(el as HTMLElement | null)"
      class="m-slider__body"
      @pointerdown="slider.onPointerDown"
      @pointermove="slider.onPointerMove"
      @pointerup="slider.onPointerUp"
      @pointercancel="slider.onPointerUp"
    >
      <!-- 珠子放在轨道外面：轨道套了笔触遮罩，放在里面会被一起裁掉 -->
      <div :ref="(el) => slider.setRail(el as HTMLElement | null)" class="m-slider__rail">
        <div class="m-slider__track" :style="sliderTrackStyle(values, geometry)" />
      </div>
      <div
        v-for="(value, index) in values"
        :id="index === 0 ? formItem.id : undefined"
        :key="index"
        :ref="(el) => slider.setThumb(index, el as HTMLElement | null)"
        class="m-slider__thumb"
        :class="{ 'm-slider__thumb--active': state.active === index }"
        :style="sliderThumbLeft(value, geometry)"
        :data-index="index"
        :tabindex="sliderTabIndex(disabled)"
        v-bind="sliderThumbAria(index, values, { ...geometry, disabled, formatTooltip })"
        @keydown="slider.onKeyDown(index, $event)"
      >
        <div v-if="showTooltip" class="m-slider__tooltip" aria-hidden="true">
          {{ sliderTooltipText(value, formatTooltip) }}
        </div>
      </div>
    </div>
  </div>
</template>
