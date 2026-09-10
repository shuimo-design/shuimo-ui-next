<script setup lang="ts">
import "./form.css";
import { provide, toRef } from "vue";
import { formKey, type FormField } from "./context";
import type {
  FormEmits,
  FormExpose,
  FormFieldError,
  FormProps,
  FormSlots,
  FormValidateResult,
} from "./types";

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

// 用数组不用 Set：校验结果要按表单项在页面上的顺序返回
const fields: FormField[] = [];

function pick(props?: string | string[]): FormField[] {
  if (props === undefined) return fields.filter((field) => field.prop.value !== undefined);
  const wanted = new Set(Array.isArray(props) ? props : [props]);
  return fields.filter((field) => {
    const prop = field.prop.value;
    return prop !== undefined && wanted.has(prop);
  });
}

async function validate(props?: string | string[]): Promise<FormValidateResult> {
  const results = await Promise.all(pick(props).map((field) => field.validate()));
  const errors = results.filter((error): error is FormFieldError => error !== undefined);
  return { valid: errors.length === 0, errors };
}

function resetFields(props?: string | string[]) {
  for (const field of pick(props)) field.resetField();
}

function clearValidate(props?: string | string[]) {
  for (const field of pick(props)) field.clearValidate();
}

function onSubmit(event: SubmitEvent) {
  // 旧版 submit 为 false 时不让浏览器真的提交；页面用 validate() 自己决定何时发请求
  if (!submit) event.preventDefault();
  emit("submit", event);
}

provide(formKey, {
  model: toRef(() => model),
  rules: toRef(() => rules),
  disabled: toRef(() => disabled),
  inline: toRef(() => inline),
  labelWidth: toRef(() => labelWidth),
  labelPosition: toRef(() => labelPosition),
  showMessage: toRef(() => showMessage),
  hideRequiredAsterisk: toRef(() => hideRequiredAsterisk),
  addField(field) {
    fields.push(field);
  },
  removeField(field) {
    const index = fields.indexOf(field);
    if (index >= 0) fields.splice(index, 1);
  },
  onFieldValidate(prop, error) {
    emit("validate", prop, error === undefined, error?.message);
  },
});

defineExpose<FormExpose>({ validate, resetFields, clearValidate });
</script>

<template>
  <form
    class="m-form"
    :class="[
      `m-form--label-${labelPosition}`,
      { 'm-form--inline': inline, 'm-form--disabled': disabled },
    ]"
    novalidate
    @submit="onSubmit"
  >
    <slot />
  </form>
</template>
