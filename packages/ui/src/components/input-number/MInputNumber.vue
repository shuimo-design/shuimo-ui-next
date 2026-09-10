<script setup lang="ts">
import "./input-number.css";
import { computed, ref, useAttrs, useTemplateRef, watch } from "vue";
import { IconMinus, IconPlus } from "../../icons";
import { brushLineUrl } from "../../ink/assets/line";
import { inkMarkUrl } from "../../ink/assets/mark";
import { FIELD_STROKE } from "../../internal/field-stroke";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useBrushBorder } from "../../ink/stroke";
import type { InputNumberEmits, InputNumberProps } from "./types";

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
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const focused = ref(false);
const native = useTemplateRef<HTMLInputElement>("native");
const root = useTemplateRef<HTMLElement>("root");
// 外框和输入框共用同一套细笔触参数，两者并排时边框粗细一致
useBrushBorder(root, FIELD_STROKE);
// 水墨皮肤下，加减号换成素材库里一笔写出的记号，按钮与输入区之间隔一道按控件高度生成的短竖笔
const divider = brushLineUrl({ seed: 7, length: 36, thickness: 1.2, vertical: true });
const inkStyle = {
  "--m-input-number-plus": `url("${inkMarkUrl("plus", { seed: 4, strokeWidth: 2.2 })}")`,
  "--m-input-number-minus": `url("${inkMarkUrl("minus", { seed: 4, strokeWidth: 2.2 })}")`,
  "--m-input-number-divider": `url("${divider.url}")`,
  "--m-input-number-divider-band": `${divider.width}px`,
};

/** 小数点后有几位；用来把浮点加减的结果修回来（0.1 + 0.2） */
function decimalsOf(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const text = String(value);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

/** 钳制到 min/max 并按 precision 取整 */
function normalize(value: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  return precision === undefined ? clamped : Number(clamped.toFixed(precision));
}

function format(value: number | undefined): string {
  if (value === undefined) return "";
  return precision === undefined ? String(value) : value.toFixed(precision);
}

/** 显示的文本；输入过程中允许 `-`、`1.` 这类中间态 */
const text = ref(format(model.value));
watch(model, (value) => {
  text.value = format(value);
});

/** 键入时的清洗：只留数字 / 一个前置 `-` / 一个 `.`；`.` 开头补 `0.`；去前导 0；按 precision 截断 */
function sanitize(raw: string): string {
  let out = "";
  let dotted = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "-" && out === "") out += ch;
    else if (ch === "." && !dotted && precision !== 0) {
      dotted = true;
      out += ch;
    }
  }
  out = out.replace(/^(-?)\./, "$10.");
  out = out.replace(/^(-?)0+(?=\d)/, "$1");
  if (precision !== undefined) {
    const dot = out.indexOf(".");
    if (dot >= 0) out = out.slice(0, dot + 1 + precision);
  }
  return out;
}

/** 把文本解析成数：空串是 undefined，解析不了是 NaN */
function parse(raw: string): number | undefined {
  let s = raw.endsWith(".") ? raw.slice(0, -1) : raw;
  if (s === "-") s = "";
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? normalize(n) : Number.NaN;
}

function write(next: number | undefined) {
  const old = model.value;
  text.value = format(next);
  if (next !== old) {
    model.value = next;
    emit("change", next, old);
  }
  formItem?.validate("change");
}

/** 提交：清洗文本写回 model，非法则回退到旧值 */
function commit() {
  const parsed = parse(text.value);
  if (parsed !== undefined && Number.isNaN(parsed)) {
    text.value = format(model.value);
    return;
  }
  write(parsed);
}

function stepBy(direction: 1 | -1) {
  if (disabled.value || readonly) return;
  const typed = parse(text.value);
  const base = typed === undefined || Number.isNaN(typed) ? (model.value ?? normalize(0)) : typed;
  const digits = Math.max(decimalsOf(base), decimalsOf(step));
  write(normalize(Number((base + direction * step).toFixed(digits))));
}

const decreaseDisabled = computed(
  () => disabled.value || readonly || (model.value !== undefined && model.value <= min),
);
const increaseDisabled = computed(
  () => disabled.value || readonly || (model.value !== undefined && model.value >= max),
);
const ariaMin = computed(() => (Number.isFinite(min) ? min : undefined));
const ariaMax = computed(() => (Number.isFinite(max) ? max : undefined));

function onInput(event: Event) {
  const el = event.target as HTMLInputElement;
  const next = sanitize(el.value);
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
  formItem?.validate("blur");
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
    class="m-input-number"
    :class="[
      {
        'm-input-number--disabled': disabled,
        'm-input-number--readonly': readonly,
        'm-input-number--focused': focused,
        'm-input-number--controls': controls,
      },
      $attrs.class,
    ]"
    :style="[$attrs.style as string | undefined, inkStyle]"
  >
    <button
      v-if="controls"
      type="button"
      class="m-input-number__decrease"
      aria-label="减少"
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
      :id="formItem?.id.value"
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
      aria-label="增加"
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
