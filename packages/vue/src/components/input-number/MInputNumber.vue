<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from "vue";
import {
  formatNumber,
  inputNumberAriaBound,
  inputNumberBrush,
  inputNumberClasses,
  inputNumberInk,
  inputNumberStepDisabled,
  parseNumberText,
  sanitizeNumberText,
  stepNumber,
  INPUT_NUMBER_DECREASE_LABEL,
  INPUT_NUMBER_INCREASE_LABEL,
  type InputNumberEmits,
  type InputNumberProps,
} from "@shuimo-design/core";
import { IconMinus, IconPlus } from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useBrushBorder } from "../../ink";

defineOptions({ name: "MInputNumber", inheritAttrs: false });

const {
  min = -Infinity,
  max = Infinity,
  step = 1,
  precision,
  disabled: disabledProp = false,
  readonly = false,
  placeholder,
  controls = true,
  name,
} = defineProps<InputNumberProps>();
const emit = defineEmits<InputNumberEmits>();
const model = defineModel<number | undefined>();

const attrs = useAttrs();
/** class/style 落在外层，其余原生属性交给 input */
const nativeAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});
// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const focused = ref(false);
const native = useTemplateRef<HTMLInputElement>("native");
const root = useTemplateRef<HTMLElement>("root");
// 外框和输入框共用同一套细笔触参数，两者并排时边框粗细一致
useBrushBorder(root, inputNumberBrush());
// 加减号和中间那道短竖笔都在 core 里生成，两个壳共用同一份遮罩
const inkStyle = inputNumberInk();

/** 所有算术（钳制、取整、清洗、解析、步进）都在 core，这里只传边界 */
const bounds = computed(() => ({ min, max, precision }));

/** 显示的文本；输入过程中允许 `-`、`1.` 这类中间态 */
const text = ref(formatNumber(model.value, precision));
watch(model, (value) => {
  text.value = formatNumber(value, precision);
});

function write(next: number | undefined) {
  const old = model.value;
  text.value = formatNumber(next, precision);
  if (next !== old) {
    model.value = next;
    emit("change", next, old);
  }
  formItem.value.validate("change");
}

/** 提交：清洗文本写回 model，非法则回退到旧值 */
function commit() {
  const parsed = parseNumberText(text.value, bounds.value);
  if (parsed !== undefined && Number.isNaN(parsed)) {
    text.value = formatNumber(model.value, precision);
    return;
  }
  write(parsed);
}

function stepBy(direction: 1 | -1) {
  if (disabled.value || readonly) return;
  write(
    stepNumber({ text: text.value, value: model.value, step, direction, bounds: bounds.value }),
  );
}

const classes = computed(() =>
  inputNumberClasses({
    disabled: disabled.value,
    readonly,
    focused: focused.value,
    controls,
  }),
);
const decreaseDisabled = computed(() =>
  inputNumberStepDisabled({
    direction: -1,
    value: model.value,
    disabled: disabled.value,
    readonly,
    min,
    max,
  }),
);
const increaseDisabled = computed(() =>
  inputNumberStepDisabled({
    direction: 1,
    value: model.value,
    disabled: disabled.value,
    readonly,
    min,
    max,
  }),
);
const ariaMin = computed(() => inputNumberAriaBound(min));
const ariaMax = computed(() => inputNumberAriaBound(max));

function onInput(event: Event) {
  const el = event.target as HTMLInputElement;
  const next = sanitizeNumberText(el.value, precision);
  if (el.value !== next) el.value = next;
  text.value = next;
  emit("input", next);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    stepBy(event.key === "ArrowUp" ? 1 : -1);
  } else if (event.key === "Enter") {
    commit();
  }
}

function onFocus(event: FocusEvent) {
  focused.value = true;
  emit("focus", event);
}

function onBlur(event: FocusEvent) {
  focused.value = false;
  commit();
  emit("blur", event);
  formItem.value.validate("blur");
}

function focus() {
  native.value?.focus();
}
function blur() {
  native.value?.blur();
}
function select() {
  native.value?.select();
}

defineExpose({ focus, blur, select });
</script>

<template>
  <div
    ref="root"
    :class="[classes, $attrs.class]"
    :style="[$attrs.style as string | undefined, inkStyle]"
  >
    <button
      v-if="controls"
      type="button"
      class="m-input-number__decrease"
      :aria-label="INPUT_NUMBER_DECREASE_LABEL"
      tabindex="-1"
      :disabled="decreaseDisabled"
      @mousedown.prevent
      @click="stepBy(-1)"
    >
      <IconMinus class="m-input-number__icon" />
      <span class="m-input-number__glyph m-input-number__glyph--minus" aria-hidden="true" />
    </button>
    <input
      v-bind="nativeAttrs"
      :id="formItem.id"
      ref="native"
      class="m-input-number__native"
      type="text"
      role="spinbutton"
      inputmode="decimal"
      autocomplete="off"
      :value="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :name="name"
      :aria-valuenow="model"
      :aria-valuemin="ariaMin"
      :aria-valuemax="ariaMax"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    />
    <button
      v-if="controls"
      type="button"
      class="m-input-number__increase"
      :aria-label="INPUT_NUMBER_INCREASE_LABEL"
      tabindex="-1"
      :disabled="increaseDisabled"
      @mousedown.prevent
      @click="stepBy(1)"
    >
      <IconPlus class="m-input-number__icon" />
      <span class="m-input-number__glyph m-input-number__glyph--plus" aria-hidden="true" />
    </button>
  </div>
</template>
