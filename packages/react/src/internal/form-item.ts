import { createContext, useContext } from "react";
import {
  FORM_ITEM_CONTEXT_DEFAULT,
  mergeDisabled,
  type FormItemContextValue,
} from "@shuimo-design/core";

/**
 * 表单项上下文的 React 容器。形状在 core（`context/form-item.ts`），这里只有 createContext / useContext。
 * 和 Vue 那边的 `internal/form-item.ts` 一一对应：定义放在 internal 而不是组件目录，
 * 因为输入框、数字框、开关都从这里读。
 */
export const FormItemContext = createContext<FormItemContextValue>(FORM_ITEM_CONTEXT_DEFAULT);

/** 读所在表单项的上下文；不在表单里时拿到的是那份恒定的默认值，调用方不用判空 */
export function useFormItem(): FormItemContextValue {
  return useContext(FormItemContext);
}

/** 控件自身 disabled 与表单项 disabled 取或；"谁优先"那条规则在 core 的 mergeDisabled 里 */
export function useDisabled(own: boolean | undefined): boolean {
  return mergeDisabled(own, useFormItem().disabled);
}
