import { createContext, useContext } from "react";
import type { CollapseContextValue } from "@shuimo-design/core";

/**
 * 折叠面板的上下文。形状和展开项的增删规则都在 core（`context/collapse.ts`），
 * 这里只剩 React 的那层包装 —— 和 Vue 的 InjectionKey 是同一件事的两种写法，这层重复是允许的。
 *
 * 默认值是 `undefined` 而不是一份空壳：MCollapseItem 可以单独用，那时它听自己的布尔开关。
 */
export const CollapseContext = createContext<CollapseContextValue | undefined>(undefined);

/** 读最近一层 MCollapse 的上下文；单独用时是 undefined */
export function useCollapse(): CollapseContextValue | undefined {
  return useContext(CollapseContext);
}
