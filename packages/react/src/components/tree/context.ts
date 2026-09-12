/**
 * 树上下文的 React 容器。形状（字段、默认值、纯派生）在 core 的 context/tree.ts，
 * 这里只负责"怎么传下去"：createContext + useContext。
 *
 * 上下文里存的是**这一次渲染的纯值**（展开集合、勾选态表都是新对象），
 * 不是 Vue 那种 getter —— React 里 getter 读到新值也不会触发重渲染，
 * 只有换一个新的 context value 才会。MTree 每次渲染现造一个。
 */
import { createContext, useContext, type ReactNode } from "react";
import { TREE_CONTEXT_ERROR, type TreeContextValue } from "@shuimo-design/core";

export type TreeContext = TreeContextValue<ReactNode>;

export const TreeContextObject = createContext<TreeContext | null>(null);

/** 取树上下文；不在 MTree 里直接报错，比每处判空清楚 */
export function useTreeContext(): TreeContext {
  const tree = useContext(TreeContextObject);
  if (!tree) throw new Error(TREE_CONTEXT_ERROR);
  return tree;
}
