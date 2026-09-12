import { computed, inject, provide, type ComputedRef, type InjectionKey } from "vue";
import { FORM_CONTEXT_DEFAULT, type FormContextValue } from "@shuimo-design/core";

/**
 * 表单上下文的 Vue 容器。**形状、默认值、表单项集合全在 core**（`context/form.ts`），
 * 这里只剩注入钥匙和 provide / inject 那几行 —— 这是两个框架允许各写一遍的部分。
 *
 * 传的是 `ComputedRef<FormContextValue>` 而不是一堆 `Ref<字段>`：
 * 字段在 core 那边一律是纯值，"值变了要重渲染"由这一层的 computed 负责。
 */
export const formKey: InjectionKey<ComputedRef<FormContextValue>> = Symbol("m-form");

// 没有外层 MForm 时所有表单项共用这一份，不必每个实例各建一个 computed
const fallback = computed<FormContextValue>(() => FORM_CONTEXT_DEFAULT);

export function useForm(): ComputedRef<FormContextValue> {
  return inject(formKey, fallback);
}

export function provideForm(value: ComputedRef<FormContextValue>): void {
  provide(formKey, value);
}
