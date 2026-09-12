import { createContext, useContext } from "react";
import { FORM_CONTEXT_DEFAULT, type FormContextValue } from "@shuimo-design/core";

/**
 * 表单上下文的 React 容器。**形状、默认值、表单项集合全在 core**（`context/form.ts`），
 * 这里只剩 createContext / useContext —— 这是两个框架允许各写一遍的部分。
 *
 * core 那边字段一律是纯值（不是 Vue 的 Ref），所以这里直接 Provider 一个 useMemo 出来的对象就够了：
 * 值变了换新对象，React 自然重渲染下面的表单项。
 */
export const FormContext = createContext<FormContextValue>(FORM_CONTEXT_DEFAULT);

export function useForm(): FormContextValue {
  return useContext(FormContext);
}
