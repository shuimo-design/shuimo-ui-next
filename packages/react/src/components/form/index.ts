export { MForm, type MFormProps } from "./MForm";
export { MFormItem, type MFormItemProps } from "./MFormItem";
export { FormContext, useForm } from "./context";
export { FormItemContext, useDisabled, useFormItem } from "../../internal/form-item";
// 类型、规则执行器、上下文形状都在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  FormContextValue,
  FormExpose,
  FormFieldError,
  FormFieldHandle,
  FormItemContextValue,
  FormItemExpose,
  FormItemValidateState,
  FormLabelPosition,
  FormModel,
  FormRule,
  FormRuleType,
  FormRules,
  FormTrigger,
  FormValidateResult,
  FormValidator,
} from "@shuimo-design/core";
