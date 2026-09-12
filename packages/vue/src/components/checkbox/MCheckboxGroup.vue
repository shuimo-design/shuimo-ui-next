<script setup lang="ts">
import { computed, provide, toRef } from "vue";
import {
  checkboxGroupClasses,
  nextCheckboxValues,
  type CheckboxGroupContextValue,
  type CheckboxGroupEmits,
  type CheckboxGroupProps,
  type CheckboxGroupSlots,
  type CheckboxValue,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { checkboxGroupKey } from "./context";

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

// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);

function toggle(value: CheckboxValue, checked: boolean) {
  const next = nextCheckboxValues(model.value, value, checked);
  model.value = next;
  emit("change", next);
  formItem.value.validate("change");
}

// 上下文装成 computed：值 / 禁用 / min / max 任一变了，读它的子项跟着重渲染
provide(
  checkboxGroupKey,
  computed<CheckboxGroupContextValue>(() => ({
    values: model.value,
    disabled: disabled.value,
    min,
    max,
    toggle,
  })),
);

defineExpose({ direction: toRef(() => direction) });
</script>

<template>
  <div :class="checkboxGroupClasses({ direction })" role="group">
    <slot />
  </div>
</template>
