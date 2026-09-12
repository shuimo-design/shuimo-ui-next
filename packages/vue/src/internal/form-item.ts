import { computed, inject, provide, type ComputedRef, type InjectionKey } from "vue";
import {
  FORM_ITEM_CONTEXT_DEFAULT,
  mergeDisabled,
  type FormItemContextValue,
} from "@shuimo-design/core";

/**
 * 表单项上下文的 Vue 容器。形状在 core（`context/form-item.ts`），这里只有注入钥匙和读写它的几行。
 * 定义放在 internal 而不是组件目录，因为输入框、数字框、开关、选择器都从这里读。
 */
export const formItemKey: InjectionKey<ComputedRef<FormItemContextValue>> = Symbol("m-form-item");

// 不在表单里时所有控件共用这一份
const fallback = computed<FormItemContextValue>(() => FORM_ITEM_CONTEXT_DEFAULT);

export function useFormItem(): ComputedRef<FormItemContextValue> {
  return inject(formItemKey, fallback);
}

export function provideFormItem(value: ComputedRef<FormItemContextValue>): void {
  provide(formItemKey, value);
}

/** 控件自身 disabled 与表单项 disabled 取或；"谁优先"那条规则在 core 的 mergeDisabled 里 */
export function useDisabled(own: () => boolean | undefined): ComputedRef<boolean> {
  const formItem = useFormItem();
  return computed(() => mergeDisabled(own(), formItem.value.disabled));
}
