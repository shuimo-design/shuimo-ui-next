<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, useId } from "vue";
import {
  createFormItem,
  formItemClasses,
  formItemInk,
  formItemLabelStyle,
  formItemRules,
  formItemShowError,
  formItemState,
  type FormItemExpose,
  type FormItemProps,
  type FormItemSlots,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import { provideFormItem } from "../../internal/form-item";
import { useForm } from "./context";

defineOptions({ name: "MFormItem" });

const {
  label,
  prop,
  rules: ownRules,
  required = false,
  labelWidth,
  // 不写默认值 Vue 会把没传的 boolean 转成 false，这里要区分「没传」和「传了 false」
  showMessage = undefined,
  error,
  for: forProp,
} = defineProps<FormItemProps>();
const slots = defineSlots<FormItemSlots>();

const form = useForm();
const generatedId = useId();
const controlId = computed(() => forProp ?? generatedId);
const errorId = computed(() => `${controlId.value}-error`);

// 校验状态机（含 async 校验的竞态票据、resetField 的初值）整份在 core
const { controller, state: snapshot } = useController(createFormItem, () => ({
  prop,
  ownRules,
  required,
  error,
  formModel: form.value.model,
  formRules: form.value.rules,
  onValidate: form.value.onFieldValidate,
}));

// 外部 error 走渲染期派生，两边都不用 watch（为什么见 core 的 formItemState 注释）
const display = computed(() => formItemState(snapshot.value, error));

const rules = computed(() =>
  formItemRules({ prop, ownRules, required, formRules: form.value.rules }),
);
const showAsterisk = computed(
  () => rules.value.some((rule) => rule.required) && !form.value.hideRequiredAsterisk,
);
const showError = computed(() =>
  formItemShowError({
    state: display.value.state,
    message: display.value.message,
    showMessage: showMessage ?? form.value.showMessage,
  }),
);
const labelPosition = computed(() => form.value.labelPosition);
const labelStyle = computed(() =>
  formItemLabelStyle({
    labelPosition: labelPosition.value,
    labelWidth: labelWidth ?? form.value.labelWidth,
  }),
);
const classes = computed(() =>
  formItemClasses({
    labelPosition: labelPosition.value,
    asterisk: showAsterisk.value,
    state: display.value.state,
    hasLabel: Boolean(label || slots.label),
  }),
);

// 那一笔朱砂走素材登记：挂载前一律内联（服务端登记不了），挂载后才升级成 data 属性，否则水合报不匹配
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
const ink = computed(() => formItemInk(mounted.value));

onMounted(() => {
  // 登记的是控制器持有的那个句柄对象，引用恒定；prop 变了由控制器原地改它的字段
  const off = form.value.addField(controller.field);
  onScopeDispose(off);
});

provideFormItem(
  computed(() => ({
    id: controlId.value,
    disabled: form.value.disabled,
    validate(trigger) {
      void controller.validate(trigger);
    },
  })),
);

defineExpose<FormItemExpose>({
  validate: () => controller.validate(),
  resetField: controller.resetField,
  clearValidate: controller.clearValidate,
});
</script>

<template>
  <div :class="classes" :style="ink.style" v-bind="ink.attrs">
    <label
      v-if="label || slots.label"
      class="m-form-item__label"
      :for="controlId"
      :style="labelStyle"
    >
      <span v-if="showAsterisk" class="m-form-item__asterisk" aria-hidden="true">*</span>
      <slot name="label" :label="label">{{ label }}</slot>
    </label>
    <div class="m-form-item__content">
      <slot />
      <Transition name="m-form-item-error">
        <div v-if="showError" class="m-form-item__error" role="alert" :id="errorId">
          <span class="m-form-item__line" aria-hidden="true" />
          <span class="m-form-item__message">
            <slot name="error" :message="display.message">{{ display.message }}</slot>
          </span>
        </div>
      </Transition>
    </div>
  </div>
</template>
