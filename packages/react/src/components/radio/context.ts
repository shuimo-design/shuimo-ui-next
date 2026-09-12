import { createContext, useContext } from "react";
import type { RadioGroupContextValue } from "@shuimo-design/core";

/**
 * 单选框组的上下文。形状和取值规则都在 core（`context/radio.ts`），
 * 这里只剩 React 的那层包装 —— 和 Vue 的 InjectionKey 是同一件事的两种写法，这层重复是允许的。
 *
 * 默认值是 `undefined` 而不是一份空壳：单独用的单选框要听自己的 checked。
 */
export const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

/** 读最近一层 MRadioGroup 的上下文；不在组里时是 undefined */
export function useRadioGroup(): RadioGroupContextValue | undefined {
  return useContext(RadioGroupContext);
}
