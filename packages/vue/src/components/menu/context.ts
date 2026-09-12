import { inject, type InjectionKey, type Ref, type VNodeChild } from "vue";
import type { MenuItem, MenuItemData, MenuKey, MenuLabelScope } from "./types";

/** 由 data 整理出的节点，MenuNode 递归渲染用 */
export interface MenuTreeNode {
  key: MenuKey;
  label: string;
  disabled: boolean;
  children: MenuTreeNode[];
  data: MenuItemData;
}

export type MenuFocusTarget = "next" | "prev" | "first" | "last" | "parent";

export interface MenuContext {
  /** 当前项 key */
  current: Ref<MenuKey | undefined>;
  defaultExpandAll: boolean;
  isExpanded: (key: MenuKey) => boolean;
  /** 用户点开 / 收起，会发 expand 事件 */
  toggleExpand: (item: MenuItem) => void;
  /** 程序性展开（跟随当前项、初始全展开），不发事件 */
  expand: (key: MenuKey) => void;
  /** 点击或回车：叶子项设为当前项，有子菜单的项切换展开 */
  activate: (item: MenuItem, hasChildren: boolean, event: MouseEvent | KeyboardEvent) => void;
  /** 方向键移焦点：只在看得见的项之间移动 */
  moveFocus: (from: HTMLElement, target: MenuFocusTarget) => void;
  /** 传 data 时的文字渲染：有 label 插槽走插槽，否则直出 label */
  renderLabel: (scope: MenuLabelScope) => VNodeChild;
}

export const menuKey: InjectionKey<MenuContext> = Symbol("m-menu");

/** 父菜单项给子项的上下文：层级、后代登记（祖先要知道当前项在不在自己下面） */
export interface MenuParentContext {
  level: number;
  register: (key: MenuKey) => void;
  unregister: (key: MenuKey) => void;
}

export const menuParentKey: InjectionKey<MenuParentContext> = Symbol("m-menu-parent");

/** 取菜单上下文；不在 MMenu 里直接报错，比每处判空清楚 */
export function useMenuContext(): MenuContext {
  const menu = inject(menuKey);
  if (!menu) throw new Error("MMenuItem 只能放在 MMenu 里用");
  return menu;
}

export function useMenuParent(): MenuParentContext {
  const parent = inject(menuParentKey);
  if (!parent) throw new Error("MMenuItem 只能放在 MMenu 里用");
  return parent;
}
