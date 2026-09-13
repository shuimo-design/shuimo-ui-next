<script setup lang="ts" generic="T extends RadioValue = RadioValue">
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
import { unboundModel } from "../../internal/model";
import { radioGroupKey } from "./context";

defineOptions({ name: "MRadioGroup" });

const {
  disabled: disabledProp = false,
  direction = "horizontal",
  name,
} = defineProps<RadioGroupProps>();
const emit = defineEmits<RadioGroupEmits<T>>();
defineSlots<RadioGroupSlots>();
/** 组内选中的值 */
const model = defineModel<T>({ default: unboundModel });

// 上下文形状在 core（context/form-item.ts），这两行只是 Vue 的 inject 胶水
const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
// 同一组原生 radio 必须共用 name，方向键才会在组内切换；useId 在 SSR 两端一致，不会 hydration 不匹配
const generatedName = useId();

// 上下文里的值是宽的 RadioValue（子项不知道 T），到这里收窄一次
function select(value: RadioValue) {
  if (model.value === value) return;
  model.value = value as T;
  emit("change", value as T);
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
