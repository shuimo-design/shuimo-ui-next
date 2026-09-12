import { computed, inject, type ComputedRef, type InjectionKey, type Ref } from "vue";

/** 表单项向内部控件提供的上下文；由 MFormItem 注入，控件通过 useFormItem 取用 */
export interface FormItemContext {
  /** 控件 id，给 label 的 for 用；控件应把它写到原生元素上 */
  id: Ref<string | undefined>;
  /** 整项禁用 */
  disabled: Ref<boolean>;
  /** 控件值变化 / 失焦时通知表单项跑校验 */
  validate: (trigger: "change" | "blur") => void;
}

export const formItemKey: InjectionKey<FormItemContext> = Symbol("m-form-item");

export function useFormItem(): FormItemContext | undefined {
  return inject(formItemKey, undefined);
}

/** 控件自身 disabled 与表单项 disabled 取或 */
export function useDisabled(own: () => boolean | undefined): ComputedRef<boolean> {
  const formItem = useFormItem();
  return computed(() => Boolean(own() || formItem?.disabled.value));
}
