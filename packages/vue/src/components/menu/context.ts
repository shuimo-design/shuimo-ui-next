/**
 * 菜单两份上下文的 Vue 容器。形状（字段、默认值、后代登记表）在 core 的 context/menu.ts，
 * 这里只负责"怎么传下去"：InjectionKey + provide / inject。
 *
 * MMenu 放出去的那个对象里，值字段是 **getter**（`get expanded() { ... }`）：
 * Vue 的响应式要在子组件读的那一刻才建立依赖，读一个存好的普通值是追不到更新的。
 * React 那边正相反 —— getter 不触发重渲染，所以它每次渲染现造一个带当前值的对象。
 */
import { inject, type InjectionKey, type VNodeChild } from "vue";
import {
  MENU_CONTEXT_ERROR,
  type MenuContextValue,
  type MenuParentContextValue,
} from "@shuimo-design/core";

export type MenuContext = MenuContextValue<VNodeChild>;

export const menuKey: InjectionKey<MenuContext> = Symbol("m-menu");
export const menuParentKey: InjectionKey<MenuParentContextValue> = Symbol("m-menu-parent");

/** 取菜单上下文；不在 MMenu 里直接报错，比每处判空清楚 */
export function useMenuContext(): MenuContext {
  const menu = inject(menuKey);
  if (!menu) throw new Error(MENU_CONTEXT_ERROR);
  return menu;
}

export function useMenuParent(): MenuParentContextValue {
  const parent = inject(menuParentKey);
  if (!parent) throw new Error(MENU_CONTEXT_ERROR);
  return parent;
}
