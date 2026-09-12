import type { ComputedRef, InjectionKey } from "vue";
import type { CheckboxGroupContextValue } from "@shuimo-design/core";

/**
 * 上下文的形状和取值规则都在 core（`context/checkbox.ts`），这里只剩 Vue 的注入钥匙。
 * 装的是一个 computed：组里的值、禁用态、min/max 变了，读它的子项自然重渲染。
 */
export const checkboxGroupKey: InjectionKey<ComputedRef<CheckboxGroupContextValue>> =
  Symbol("m-checkbox-group");
