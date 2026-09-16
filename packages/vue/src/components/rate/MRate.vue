<script setup lang="ts">
import { computed } from "vue";
import {
  alignRateValue,
  createRate,
  rateClasses,
  rateDisplayValue,
  rateGroupAria,
  rateItemAria,
  rateItemClasses,
  rateItemHovered,
  rateItemInk,
  rateItems,
  rateItemState,
  rateTabIndex,
  rateText,
  type RateEmits,
  type RateProps,
  type RateSlots,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useController } from "../../runtime";

defineOptions({ name: "MRate" });

const {
  count = 5,
  allowHalf = false,
  allowClear = true,
  disabled: disabledProp = false,
  readonly = false,
  size = "md",
  texts,
  seed = 1,
} = defineProps<RateProps>();
const emit = defineEmits<RateEmits>();
defineSlots<RateSlots>();
/** 当前分值，0 表示没评；allowHalf 时可为 .5 */
const model = defineModel<number>({ default: 0 });

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const geometry = computed(() => ({ count, allowHalf }));
/** 对齐到步长的绑定值 */
const value = computed(() => alignRateValue(model.value, geometry.value));
const items = computed(() => rateItems(count));

// 悬停预览、点击落值 / 清零、键盘调值和焦点停靠点全在 core 的控制器里，和 React 那边是同一份
const { controller: rate, state } = useController(createRate, () => ({
  ...geometry.value,
  disabled: disabled.value,
  readonly,
  allowClear,
  value: value.value,
  onChange: (next: number) => {
    model.value = next;
    emit("change", next);
    formItem.value.validate("change");
  },
  onHoverChange: (next: number) => emit("hoverChange", next),
}));

/** 画面上显示的值：有悬停预览就是预览值 */
const display = computed(() => rateDisplayValue(value.value, state.value.hover));
const text = computed(() => rateText(texts, display.value));
</script>

<template>
  <div
    :id="formItem.id"
    :class="rateClasses({ size, disabled, readonly, allowHalf })"
    v-bind="rateGroupAria(value, { count, disabled, readonly, texts })"
    @pointerleave="rate.onPointerLeave"
  >
    <span
      v-for="index in items"
      :key="index"
      :ref="(el) => rate.setItem(index, el as HTMLElement | null)"
      :class="
        rateItemClasses({
          state: rateItemState(index, display),
          hovered: rateItemHovered(index, state.hover),
        })
      "
      :style="rateItemInk(seed, index)"
      :tabindex="rateTabIndex(index, value, { disabled })"
      v-bind="rateItemAria(index, value, { count, texts })"
      @pointermove="rate.onPointerMove(index, $event)"
      @click="rate.onClick(index, $event)"
      @keydown="rate.onKeyDown(index, $event)"
    >
      <!-- 底层画整格：满格才是选中态 -->
      <span
        class="m-rate__char"
        :class="{ 'm-rate__char--active': rateItemState(index, display) === 'full' }"
      >
        <slot name="character" :index="index" :active="rateItemState(index, display) === 'full'">
          <span class="m-rate__dot" />
        </slot>
      </span>
      <!-- 半格：再叠一层选中态、只露左半 -->
      <span
        v-if="rateItemState(index, display) === 'half'"
        class="m-rate__char m-rate__char--active m-rate__char--half"
        aria-hidden="true"
      >
        <slot name="character" :index="index" :active="true">
          <span class="m-rate__dot" />
        </slot>
      </span>
    </span>
    <span v-if="text" class="m-rate__text">{{ text }}</span>
  </div>
</template>
