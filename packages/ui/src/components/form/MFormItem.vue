<script setup lang="ts">
import "./form.css";
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  toRef,
  useId,
  watch,
} from "vue";
import { brushLineUrl } from "../../ink/assets/line";
import { inkVarBindings } from "../../ink/registry";
import { formItemKey } from "../../internal/form-item";
import { formKey, type FormField } from "./context";
import type {
  FormFieldError,
  FormItemExpose,
  FormItemProps,
  FormItemSlots,
  FormItemValidateState,
  FormRule,
  FormTrigger,
} from "./types";
import {
  cloneValue,
  getByPath,
  normalizeRules,
  rulesForTrigger,
  runRules,
  setByPath,
} from "./validate";

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

const form = inject(formKey, undefined);
const generatedId = useId();
const controlId = computed(() => forProp ?? generatedId);
const errorId = computed(() => `${controlId.value}-error`);

const validateState = ref<FormItemValidateState>("");
const validateMessage = ref("");
// 每次 validate 递增，慢的 async 校验回来时发现号不对就丢掉，避免旧结果盖住新结果
let validateSeq = 0;
// 挂载时的值，resetField 用；表单项后来才出现的字段以出现时为准
let initialValue: unknown;

const rules = computed<FormRule[]>(() => {
  const list = normalizeRules(ownRules ?? (prop ? form?.rules.value?.[prop] : undefined));
  if (required && !list.some((rule) => rule.required)) return [{ required: true }, ...list];
  return list;
});
const isRequired = computed(() => rules.value.some((rule) => rule.required));
const showAsterisk = computed(() => isRequired.value && !form?.hideRequiredAsterisk.value);
const shouldShowMessage = computed(() => showMessage ?? form?.showMessage.value ?? true);
const showError = computed(
  () => validateState.value === "error" && shouldShowMessage.value && validateMessage.value !== "",
);
const labelPosition = computed(() => form?.labelPosition.value ?? "left");
const labelStyle = computed(() => {
  if (labelPosition.value === "top") return undefined;
  const width = labelWidth ?? form?.labelWidth.value ?? 120;
  return { width: typeof width === "number" ? `${width}px` : width };
});

// 出错时控件下方那一笔朱砂：按内容区最大宽度生成，短于它时只缩不拉
const line = brushLineUrl({ seed: 11, length: 320, thickness: 2, flyingWhite: 0.1 });
// 这一笔是固定素材，每个表单项都一样：走素材登记，样式表里只写一次，元素上只挂属性；登记不了（SSR）才内联
const ink = inkVarBindings({ "--m-form-item-line-mask": line.url });
const inkStyle = {
  ...ink.style,
  "--m-form-item-line-band": `${line.height}px`,
  "--m-form-item-line-w": `${line.width}px`,
};

function currentValue(): unknown {
  return prop ? getByPath(form?.model.value, prop) : undefined;
}

async function validate(trigger?: FormTrigger): Promise<FormFieldError | undefined> {
  // 外部塞的 error 优先，控件交互不会把它冲掉
  if (error) return prop ? { prop, message: error } : undefined;
  // 已经在报错的项，任何时机都全量复核：否则 blur 只跑 blur 规则一通过，就把 change 规则报的错清掉了
  const list =
    validateState.value === "error" ? rules.value : rulesForTrigger(rules.value, trigger);
  if (!prop || list.length === 0) return undefined;
  const seq = ++validateSeq;
  validateState.value = "validating";
  const message = await runRules(list, currentValue(), form?.model.value ?? {});
  if (seq !== validateSeq) return undefined;
  validateState.value = message === undefined ? "success" : "error";
  validateMessage.value = message ?? "";
  const result = message === undefined ? undefined : { prop, message };
  form?.onFieldValidate(prop, result);
  return result;
}

function clearValidate() {
  validateSeq++;
  validateState.value = "";
  validateMessage.value = "";
}

function resetField() {
  if (prop && form?.model.value) setByPath(form.model.value, prop, cloneValue(initialValue));
  clearValidate();
}

watch(
  () => error,
  (message) => {
    if (message) {
      validateSeq++;
      validateState.value = "error";
      validateMessage.value = message;
    } else if (validateState.value === "error") {
      clearValidate();
    }
  },
  { immediate: true },
);

const field: FormField = {
  prop: toRef(() => prop),
  validate,
  resetField,
  clearValidate,
};

onMounted(() => {
  initialValue = cloneValue(currentValue());
  form?.addField(field);
});
onBeforeUnmount(() => {
  form?.removeField(field);
});

provide(formItemKey, {
  id: controlId,
  disabled: computed(() => form?.disabled.value ?? false),
  validate(trigger) {
    void validate(trigger);
  },
});

defineExpose<FormItemExpose>({
  validate: () => validate(),
  resetField,
  clearValidate,
  validateState,
  validateMessage,
});
</script>

<template>
  <div
    class="m-form-item"
    :class="[
      `m-form-item--label-${labelPosition}`,
      {
        'm-form-item--required': showAsterisk,
        'm-form-item--error': validateState === 'error',
        'm-form-item--validating': validateState === 'validating',
        'm-form-item--success': validateState === 'success',
        'm-form-item--no-label': !label && !slots.label,
      },
    ]"
    :style="inkStyle"
    v-bind="ink.attrs"
  >
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
            <slot name="error" :message="validateMessage">{{ validateMessage }}</slot>
          </span>
        </div>
      </Transition>
    </div>
  </div>
</template>
