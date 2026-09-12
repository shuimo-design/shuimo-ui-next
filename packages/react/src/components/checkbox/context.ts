import { createContext, useContext } from "react";
import type { CheckboxGroupContextValue } from "@shuimo-design/core";

/**
 * 复选框组的上下文。形状和取值规则都在 core（`context/checkbox.ts`），
 * 这里只剩 React 的那层包装 —— 和 Vue 的 InjectionKey 是同一件事的两种写法，这层重复是允许的。
 *
 * 默认值是 `undefined` 而不是一份空壳：单独用的复选框要听自己的 checked，
 * 给了空壳它就分不清该听谁的了。
 */
export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | undefined>(undefined);

/** 读最近一层 MCheckboxGroup 的上下文；不在组里时是 undefined */
export function useCheckboxGroup(): CheckboxGroupContextValue | undefined {
  return useContext(CheckboxGroupContext);
}
