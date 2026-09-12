<script setup lang="ts">
import { computed } from "vue";
import {
  createFormFields,
  formClasses,
  type FormEmits,
  type FormExpose,
  type FormProps,
  type FormSlots,
} from "@shuimo-design/core";
import { provideForm } from "./context";

defineOptions({ name: "MForm" });

const {
  model,
  rules,
  inline = false,
  labelWidth = 120,
  labelPosition = "left",
  disabled = false,
  submit = false,
  showMessage = true,
  hideRequiredAsterisk = false,
} = defineProps<FormProps>();
const emit = defineEmits<FormEmits>();
defineSlots<FormSlots>();

// 表单项集合（登记、按 prop 挑、整表校验 / 重置 / 清状态）整套都在 core，两个壳共用
const fields = createFormFields();

function onSubmit(event: SubmitEvent) {
  // submit 为 false 时不让浏览器真的提交；页面用 validate() 自己决定何时发请求
  if (!submit) event.preventDefault();
  emit("submit", event);
}

provideForm(
  computed(() => ({
    model,
    rules,
    disabled,
    inline,
    labelWidth,
    labelPosition,
    showMessage,
    hideRequiredAsterisk,
    addField: fields.add,
    onFieldValidate(prop, error) {
      emit("validate", prop, error === undefined, error?.message);
    },
  })),
);

defineExpose<FormExpose>({
  validate: fields.validate,
  resetFields: fields.resetFields,
  clearValidate: fields.clearValidate,
});
</script>

<template>
  <form :class="formClasses({ labelPosition, inline, disabled })" novalidate @submit="onSubmit">
    <slot />
  </form>
</template>
