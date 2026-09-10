<script setup lang="ts">
import "./radio.css";
import { computed, inject } from "vue";
import { inkBlobUrl } from "../../ink/assets/blob";
import { inkCircleUrl } from "../../ink/assets/circle";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { radioGroupKey } from "./context";
import type { RadioEmits, RadioProps, RadioSlots, RadioValue } from "./types";

defineOptions({ name: "MRadio" });

const { value, label, disabled: disabledProp = false, name } = defineProps<RadioProps>();
const emit = defineEmits<RadioEmits>();
defineSlots<RadioSlots>();
const model = defineModel<RadioValue>();

const group = inject(radioGroupKey, undefined);
const formItem = useFormItem();
const ownDisabled = useDisabled(() => disabledProp);

const checked = computed(() => (group ? group.modelValue.value : model.value) === value);
const disabled = computed(() => ownDisabled.value || Boolean(group?.disabled.value));
const nativeName = computed(() => name ?? group?.name.value);

// 水墨皮肤：外圈是一笔绕出来的墨圈（左上有接头、右下最饱），选中后中心落一团毛边墨点
// 都按 2 倍画幅生成再缩到 20px 左右，晕染位移才不会把小圆撕散
const inkStyle = {
  "--m-radio-ring-mask": `url("${inkCircleUrl({ seed: 5, size: 40, thickness: 4.4, raggedness: 0.55 })}")`,
  "--m-radio-dot-mask": `url("${inkBlobUrl({ seed: 5, size: 24, radius: 0.4, raggedness: 0.16 })}")`,
};

function onChange(event: Event) {
  if (disabled.value || !(event.target as HTMLInputElement).checked) return;
  if (group) {
    group.select(value);
  } else {
    model.value = value;
  }
  emit("change", value, event);
  formItem?.validate("change");
}
</script>

<template>
  <label
    class="m-radio"
    :class="{
      'm-radio--checked': checked,
      'm-radio--disabled': disabled,
    }"
    :style="inkStyle"
  >
    <input
      :id="group ? undefined : formItem?.id.value"
      class="m-radio__input"
      type="radio"
      :name="nativeName"
      :checked="checked"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="m-radio__dot" aria-hidden="true" />
    <span v-if="$slots.default || label !== undefined" class="m-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
