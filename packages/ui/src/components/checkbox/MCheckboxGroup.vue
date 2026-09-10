<script setup lang="ts">
import "./checkbox.css";
import { provide, toRef } from "vue";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { checkboxGroupKey } from "./context";
import type {
  CheckboxGroupEmits,
  CheckboxGroupProps,
  CheckboxGroupSlots,
  CheckboxValue,
} from "./types";

defineOptions({ name: "MCheckboxGroup" });

const {
  disabled: disabledProp = false,
  min,
  max,
  direction = "horizontal",
} = defineProps<CheckboxGroupProps>();
const emit = defineEmits<CheckboxGroupEmits>();
defineSlots<CheckboxGroupSlots>();
const model = defineModel<CheckboxValue[]>({ default: () => [] });

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);

provide(checkboxGroupKey, {
  modelValue: model,
  disabled,
  canCheck: () => max === undefined || model.value.length < max,
  canUncheck: () => min === undefined || model.value.length > min,
  toggle(value, checked) {
    const next = checked
      ? model.value.includes(value)
        ? model.value
        : [...model.value, value]
      : model.value.filter((v) => v !== value);
    model.value = next;
    emit("change", next);
    formItem?.validate("change");
  },
});

defineExpose({ direction: toRef(() => direction) });
</script>

<template>
  <div class="m-checkbox-group" :class="`m-checkbox-group--${direction}`" role="group">
    <slot />
  </div>
</template>
