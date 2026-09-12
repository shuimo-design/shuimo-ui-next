export { default as MForm } from "./MForm.vue";
export { default as MFormItem } from "./MFormItem.vue";
export { formKey, useForm, provideForm } from "./context";
// 类型、规则执行器、上下文形状都在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  FormContextValue,
  FormEmits,
  FormExpose,
  FormFieldError,
  FormFieldHandle,
  FormItemContextValue,
  FormItemExpose,
  FormItemProps,
  FormItemSlots,
  FormItemValidateState,
  FormLabelPosition,
  FormModel,
  FormProps,
  FormRule,
  FormRuleType,
  FormRules,
  FormSlots,
  FormTrigger,
  FormValidateResult,
  FormValidator,
} from "@shuimo-design/core";
