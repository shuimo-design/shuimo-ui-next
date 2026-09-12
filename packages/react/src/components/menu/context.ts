/**
 * 菜单两份上下文的 React 容器。形状（字段、默认值、后代登记表）在 core 的 context/menu.ts，
 * 这里只负责"怎么传下去"：createContext + useContext。
 *
 * 上下文里存的是**这一次渲染的纯值**（展开集合是新的 Set），不是 Vue 那种 getter ——
 * React 里 getter 读到新值也不会触发重渲染，只有换一个新的 context value 才会。
 */
import { createContext, useContext, type ReactNode } from "react";
import {
  MENU_CONTEXT_ERROR,
  MENU_ROOT_PARENT,
  type MenuContextValue,
  type MenuParentContextValue,
} from "@shuimo-design/core";

export type MenuContext = MenuContextValue<ReactNode>;

export const MenuContextObject = createContext<MenuContext | null>(null);

/** 默认值就是根层：一级项的 level 是 0，根不用记后代 */
export const MenuParentContextObject = createContext<MenuParentContextValue>(MENU_ROOT_PARENT);

/** 取菜单上下文；不在 MMenu 里直接报错，比每处判空清楚 */
export function useMenuContext(): MenuContext {
  const menu = useContext(MenuContextObject);
  if (!menu) throw new Error(MENU_CONTEXT_ERROR);
  return menu;
}

export function useMenuParent(): MenuParentContextValue {
  return useContext(MenuParentContextObject);
}
