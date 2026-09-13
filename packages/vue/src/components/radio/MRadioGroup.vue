<script setup lang="ts">
import { computed, provide, toRef, useId } from "vue";
import {
  radioGroupClasses,
  type RadioGroupContextValue,
  type RadioGroupEmits,
  type RadioGroupProps,
  type RadioGroupSlots,
  type RadioValue,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { radioGroupKey } from "./context";

defineOptions({ name: "MRadioGroup" });

const {
  disabled: disabledProp = false,
  direction = "horizontal",
  name,
} = defineProps<RadioGroupProps>();
const emit = defineEmits<RadioGroupEmits>();
defineSlots<RadioGroupSlots>();
/** 组内选中的值 */
const model = defineModel<RadioValue>();

// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
// 同一组原生 radio 必须共用 name，方向键才会在组内切换；useId 在 SSR 两端一致，不会 hydration 不匹配
const generatedName = useId();

function select(value: RadioValue) {
  if (model.value === value) return;
  model.value = value;
  emit("change", value);
  formItem.value.validate("change");
}

// 上下文装成 computed：选中值 / 禁用 / name 任一变了，读它的子项跟着重渲染
provide(
  radioGroupKey,
  computed<RadioGroupContextValue>(() => ({
    value: model.value,
    disabled: disabled.value,
    name: name ?? generatedName,
    select,
  })),
);

defineExpose({ direction: toRef(() => direction) });
</script>

<template>
  <div :class="radioGroupClasses({ direction })" role="radiogroup">
    <slot />
  </div>
</template>
