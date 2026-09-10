<script setup lang="ts">
import "./input.css";
import { computed, onMounted, ref, useAttrs, useTemplateRef } from "vue";
import { IconClose, IconEye, IconEyeOff } from "../../icons";
import { FIELD_STROKE } from "../../internal/field-stroke";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useBrushBorder } from "../../ink/stroke";
import type { InputEmits, InputProps, InputSlots } from "./types";

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
const model = defineModel<string>({ default: "" });

const attrs = useAttrs();
/** class/style 落在外层，其余原生属性交给 input */
const nativeAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const focused = ref(false);
const passwordVisible = ref(false);
const native = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>("native");
const root = useTemplateRef<HTMLElement>("root");
// 水墨皮肤：外框换成一笔细笔触（参数与其他表单控件共用），聚焦 / 禁用只换墨色（见 input.css 的 m.ink 层）
useBrushBorder(root, FIELD_STROKE);

// 模板里不带类型地绑一个数字很常见，显示前统一转成字符串，免得 .length 之类在数字上炸掉
const text = computed(() => String(model.value));
/** 按字符（码点）数，emoji 这类算一个字 */
const count = computed(() => Array.from(text.value).length);
const isTextarea = computed(() => type === "textarea");
const nativeType = computed(() => {
  if (type === "password" && passwordVisible.value) return "text";
  return isTextarea.value ? undefined : type;
});
const showClear = computed(
  () => clearable && !disabled.value && !readonly && text.value.length > 0,
);
const showEye = computed(() => type === "password" && showPassword && !disabled.value);
const hasSuffix = computed(
  () => showClear.value || showEye.value || !!slots.suffix || (showCount && !isTextarea.value),
);
const rootStyle = computed(() => [
  attrs.style as string | Record<string, string> | undefined,
  { "--m-input-resize": resize },
]);

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  model.value = value;
  emit("input", value);
}

function onChange(event: Event) {
  emit("change", (event.target as HTMLInputElement).value);
  formItem?.validate("change");
}

function onFocus(event: FocusEvent) {
  focused.value = true;
  emit("focus", event);
}

function onBlur(event: FocusEvent) {
  focused.value = false;
  emit("blur", event);
  formItem?.validate("blur");
}

function clear() {
  model.value = "";
  emit("input", "");
  emit("change", "");
  emit("clear");
  formItem?.validate("change");
  native.value?.focus();
}

/** 点在外框空白处也把焦点送进输入框，和点在文字上一样 */
function onRootMousedown(event: MouseEvent) {
  if (event.target === native.value || disabled.value) return;
  const target = event.target as HTMLElement;
  if (target.closest(".m-input__action")) return;
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
  <div
    ref="root"
    class="m-input"
    :class="[
      `m-input--${type}`,
      {
        'm-input--disabled': disabled,
        'm-input--readonly': readonly,
        'm-input--focused': focused,
        'm-input--textarea': isTextarea,
        'm-input--with-prefix': !!slots.prefix,
        'm-input--with-suffix': hasSuffix,
        'm-input--with-count': showCount,
      },
      $attrs.class,
    ]"
    :style="rootStyle"
    @mousedown="onRootMousedown"
  >
    <span v-if="slots.prefix" class="m-input__prefix"><slot name="prefix" /></span>
    <component
      :is="isTextarea ? 'textarea' : 'input'"
      v-bind="nativeAttrs"
      :id="formItem?.id.value"
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
        aria-label="清空"
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
        :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
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
        {{ count }}<template v-if="maxlength"> / {{ maxlength }}</template>
      </span>
    </span>
    <!-- 多行时字数落在右下角，不占一行 -->
    <span v-if="showCount && isTextarea" class="m-input__count" aria-live="polite">
      {{ count }}<template v-if="maxlength"> / {{ maxlength }}</template>
    </span>
  </div>
</template>
