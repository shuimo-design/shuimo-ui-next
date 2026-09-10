<script setup lang="ts">
import "./checkbox.css";
import { computed, inject, ref } from "vue";
import { brushLineUrl } from "../../ink/assets/line";
import { generateInkShape } from "../../ink/assets/shape";
import { useBrushBorder } from "../../ink/stroke";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { checkboxGroupKey } from "./context";
import type { CheckboxEmits, CheckboxProps, CheckboxSlots } from "./types";

defineOptions({ name: "MCheckbox" });

const {
  value,
  label,
  disabled: disabledProp = false,
  indeterminate = false,
  name,
} = defineProps<CheckboxProps>();
const emit = defineEmits<CheckboxEmits>();
defineSlots<CheckboxSlots>();
const model = defineModel<boolean>({ default: false });

const group = inject(checkboxGroupKey, undefined);
const formItem = useFormItem();
const ownDisabled = useDisabled(() => disabledProp);

const checked = computed(() =>
  group && value !== undefined ? group.modelValue.value.includes(value) : model.value,
);
const disabled = computed(() => {
  if (ownDisabled.value || group?.disabled.value) return true;
  if (group && value !== undefined) {
    return checked.value ? !group.canUncheck(value) : !group.canCheck(value);
  }
  return false;
});

// 水墨皮肤：方框是四边各一细笔的笔触边框，拐角只略出头，贴近旧版位图那种收得住的手画方框
const box = ref<HTMLElement | null>(null);
useBrushBorder(box, { strokeWidth: 2, seed: 11, overshoot: 0.6, wobble: 0.4, flyingWhite: 0.05 });

/**
 * 勾选墨块与半选一横都按 4 倍画幅生成再缩到 10px 左右：
 * 素材库的晕染位移是按像素算的，直接画 10px 的形会被位移撕碎。
 */
const MARK_SCALE = 4;
const mark = generateInkShape(40, 36, { seed: 11, raggedness: 0.9, corner: 0.1 });
// 笔触线画幅两端各留 thickness * 1.5 + wobble 的余量（这里是 16px），72 长的画幅里笔画本身约 40px，缩后正好 10px
const bar = brushLineUrl({ seed: 11, length: 72, thickness: 10, flyingWhite: 0.04, wobble: 1 });
const inkStyle = {
  "--m-checkbox-mark-mask": `url("${mark.url}")`,
  "--m-checkbox-mark-pad": `${mark.padding / MARK_SCALE}px`,
  "--m-checkbox-bar-mask": `url("${bar.url}")`,
  "--m-checkbox-bar-w": `${bar.width / MARK_SCALE}px`,
  "--m-checkbox-bar-band": `${bar.height / MARK_SCALE}px`,
};

function onChange(event: Event) {
  if (disabled.value) return;
  const next = (event.target as HTMLInputElement).checked;
  if (group && value !== undefined) {
    group.toggle(value, next);
  } else {
    model.value = next;
  }
  emit("change", next, event);
  formItem?.validate("change");
}
</script>

<template>
  <label
    class="m-checkbox"
    :class="{
      'm-checkbox--checked': checked,
      'm-checkbox--indeterminate': indeterminate,
      'm-checkbox--disabled': disabled,
    }"
    :style="inkStyle"
  >
    <input
      :id="group ? undefined : formItem?.id.value"
      class="m-checkbox__input"
      type="checkbox"
      :name="name"
      :checked="checked"
      :disabled="disabled"
      :aria-checked="indeterminate ? 'mixed' : checked"
      @change="onChange"
    />
    <span ref="box" class="m-checkbox__box" aria-hidden="true">
      <!-- 勾选是框里一块实墨，半选是一横；默认皮肤靠 CSS，m.ink 层换成毛边墨块 / 短笔触遮罩 -->
      <span class="m-checkbox__mark" />
    </span>
    <span v-if="$slots.default || label !== undefined" class="m-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
