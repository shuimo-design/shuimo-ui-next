<script setup lang="ts">
import "./radio.css";
import { provide, toRef, useId } from "vue";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { radioGroupKey } from "./context";
import type { RadioGroupEmits, RadioGroupProps, RadioGroupSlots, RadioValue } from "./types";

defineOptions({ name: "MRadioGroup" });

const {
  disabled: disabledProp = false,
  direction = "horizontal",
  name,
} = defineProps<RadioGroupProps>();
const emit = defineEmits<RadioGroupEmits>();
defineSlots<RadioGroupSlots>();
const model = defineModel<RadioValue>();

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
// 同一组原生 radio 必须共用 name，方向键才会在组内切换；useId 在 SSR 两端一致，不会 hydration 不匹配
const generatedName = useId();

provide(radioGroupKey, {
  modelValue: model,
  disabled,
  name: toRef(() => name ?? generatedName),
  select(value) {
    if (model.value === value) return;
    model.value = value;
    emit("change", value);
    formItem?.validate("change");
  },
});

defineExpose({ direction: toRef(() => direction) });
</script>

<template>
  <div class="m-radio-group" :class="`m-radio-group--${direction}`" role="radiogroup">
    <slot />
  </div>
</template>
