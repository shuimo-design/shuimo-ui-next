import type { ComputedRef, InjectionKey } from "vue";
import type { RadioGroupContextValue } from "@shuimo-design/core";

/**
 * 上下文的形状和取值规则都在 core（`context/radio.ts`），这里只剩 Vue 的注入钥匙。
 * 装的是一个 computed：组里选中的值、禁用态、共用的 name 变了，读它的子项自然重渲染。
 */
export const radioGroupKey: InjectionKey<ComputedRef<RadioGroupContextValue>> =
  Symbol("m-radio-group");
