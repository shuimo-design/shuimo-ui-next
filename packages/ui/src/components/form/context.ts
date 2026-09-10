import type { InjectionKey, Ref } from "vue";
import type { FormFieldError, FormLabelPosition, FormModel, FormRules, FormTrigger } from "./types";

/** MFormItem 向 MForm 登记的句柄，表单整体校验 / 重置时逐个调用 */
export interface FormField {
  prop: Ref<string | undefined>;
  validate: (trigger?: FormTrigger) => Promise<FormFieldError | undefined>;
  resetField: () => void;
  clearValidate: () => void;
}

export interface FormContext {
  model: Ref<FormModel | undefined>;
  rules: Ref<FormRules | undefined>;
  disabled: Ref<boolean>;
  inline: Ref<boolean>;
  labelWidth: Ref<string | number>;
  labelPosition: Ref<FormLabelPosition>;
  showMessage: Ref<boolean>;
  hideRequiredAsterisk: Ref<boolean>;
  addField: (field: FormField) => void;
  removeField: (field: FormField) => void;
  /** 表单项校验完毕后回报，MForm 转成 validate 事件 */
  onFieldValidate: (prop: string, error: FormFieldError | undefined) => void;
}

export const formKey: InjectionKey<FormContext> = Symbol("m-form");
