<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useTemplateRef } from "vue";
import {
  inputBrush,
  inputClasses,
  inputCount,
  inputCountText,
  inputHasSuffix,
  inputIsTextarea,
  inputNativeType,
  inputRedirectFocus,
  inputShowClear,
  inputShowEye,
  inputStyle,
  inputText,
  INPUT_CLEAR_LABEL,
  INPUT_PASSWORD_HIDE_LABEL,
  INPUT_PASSWORD_SHOW_LABEL,
  type InputEmits,
  type InputProps,
  type InputSlots,
} from "@shuimo-design/core";
import { IconClose, IconEye, IconEyeOff } from "../../icons";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useBrushBorder } from "../../ink";

defineOptions({ name: "MInput", inheritAttrs: false });

const {
  type = "text",
  placeholder,
  disabled: disabledProp = false,
  readonly = false,
  clearable = false,
  showPassword = false,
  maxlength,
  showCount = false,
  rows = 3,
  resize = "vertical",
  name,
  autocomplete,
  autofocus = false,
} = defineProps<InputProps>();
const emit = defineEmits<InputEmits>();
const slots = defineSlots<InputSlots>();
/** 输入框的值 */
const model = defineModel<string>({ default: "" });

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
const passwordVisible = ref(false);
const native = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>("native");
const root = useTemplateRef<HTMLElement>("root");
// 水墨皮肤：外框换成一笔细笔触（参数与其他表单控件共用），聚焦 / 禁用只换墨色（见 input.css 的 m.ink 层）
useBrushBorder(root, inputBrush());

const text = computed(() => inputText(model.value));
const count = computed(() => inputCount(text.value));
const isTextarea = computed(() => inputIsTextarea(type));
const nativeType = computed(() => inputNativeType(type, passwordVisible.value));
const showClear = computed(() =>
  inputShowClear({ clearable, disabled: disabled.value, readonly, text: text.value }),
);
const showEye = computed(() => inputShowEye({ type, showPassword, disabled: disabled.value }));
const hasSuffix = computed(() =>
  inputHasSuffix({
    showClear: showClear.value,
    showEye: showEye.value,
    hasSuffixSlot: !!slots.suffix,
    showCount,
    isTextarea: isTextarea.value,
  }),
);
const classes = computed(() =>
  inputClasses({
    type,
    disabled: disabled.value,
    readonly,
    focused: focused.value,
    isTextarea: isTextarea.value,
    hasPrefix: !!slots.prefix,
    hasSuffix: hasSuffix.value,
    showCount,
  }),
);
const countText = computed(() => inputCountText(count.value, maxlength));
const rootStyle = computed(() => [
  attrs.style as string | Record<string, string> | undefined,
  inputStyle(resize),
]);

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  model.value = value;
  emit("input", value);
}

function onChange(event: Event) {
  emit("change", (event.target as HTMLInputElement).value);
  formItem.value.validate("change");
}

function onFocus(event: FocusEvent) {
  focused.value = true;
  emit("focus", event);
}

function onBlur(event: FocusEvent) {
  focused.value = false;
  emit("blur", event);
  formItem.value.validate("blur");
}

function clear() {
  model.value = "";
  emit("input", "");
  emit("change", "");
  emit("clear");
  formItem.value.validate("change");
  native.value?.focus();
}

/** 点在外框空白处也把焦点送进输入框，和点在文字上一样 */
function onRootMousedown(event: MouseEvent) {
  const redirect = inputRedirectFocus({
    target: event.target as HTMLElement | null,
    native: native.value,
    disabled: disabled.value,
  });
  if (!redirect) return;
  event.preventDefault();
  native.value?.focus();
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

onMounted(() => {
  if (autofocus) focus();
});

defineExpose({ focus, blur, select });
</script>

<template>
  <div ref="root" :class="[classes, $attrs.class]" :style="rootStyle" @mousedown="onRootMousedown">
    <span v-if="slots.prefix" class="m-input__prefix"><slot name="prefix" /></span>
    <component
      :is="isTextarea ? 'textarea' : 'input'"
      v-bind="nativeAttrs"
      :id="formItem.id"
      ref="native"
      class="m-input__native"
      :type="nativeType"
      :value="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :rows="isTextarea ? rows : undefined"
      :name="name"
      :autocomplete="autocomplete"
      @input="onInput"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
    />
    <span v-if="hasSuffix" class="m-input__suffix">
      <button
        v-if="showClear"
        type="button"
        class="m-input__action"
        :aria-label="INPUT_CLEAR_LABEL"
        tabindex="-1"
        @mousedown.prevent
        @click="clear"
      >
        <IconClose />
      </button>
      <button
        v-if="showEye"
        type="button"
        class="m-input__action"
        :aria-label="passwordVisible ? INPUT_PASSWORD_HIDE_LABEL : INPUT_PASSWORD_SHOW_LABEL"
        :aria-pressed="passwordVisible"
        tabindex="-1"
        @mousedown.prevent
        @click="passwordVisible = !passwordVisible"
      >
        <IconEyeOff v-if="passwordVisible" />
        <IconEye v-else />
      </button>
      <slot name="suffix" />
      <span v-if="showCount && !isTextarea" class="m-input__count" aria-live="polite">
        {{ countText }}
      </span>
    </span>
    <!-- 多行时字数落在右下角，不占一行 -->
    <span v-if="showCount && isTextarea" class="m-input__count" aria-live="polite">
      {{ countText }}
    </span>
  </div>
</template>
