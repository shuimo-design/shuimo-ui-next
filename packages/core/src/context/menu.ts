/**
 * 菜单的两份上下文形状。
 *
 * 和树一样，字段一律是纯值：原来 `current: Ref<MenuKey>`、`isExpanded: (key) => boolean`
 * 那种写法只有 Vue 的响应式接得住，React 里 getter 不触发重渲染，搬过去会静默失效。
 * 现在展开集合是一个 ReadonlySet，变了就换一个新的，两边各自重渲染。
 *
 * 两份的分工照旧：
 * - MenuContextValue 是全局行为（当前项、展开、点击、移焦点），MMenu 放出去，所有层级共用；
 * - MenuParentContextValue 是"我上面那一层"，每个 MMenuItem 都往下放一份新的，
 *   层级从这里逐层加一，后代登记也顺着它一路往上冒泡。
 */
import type { Registry, RegistrySnapshot } from "./registry";
import { createRegistry } from "./registry";
import type { MenuFocusTarget, MenuItem, MenuKey, MenuLabelScope } from "../components/menu/types";

/**
 * Label 是"渲染出来的东西"的类型：Vue 传 VNodeChild，React 传 ReactNode。
 * core 不认识这两种类型，所以留成泛型参数，默认 unknown。
 */
export interface MenuContextValue<Label = unknown> {
  /** 当前项 key */
  readonly current: MenuKey | undefined;
  /** 初始展开全部子菜单 */
  readonly defaultExpandAll: boolean;
  /** 展开的 key（纯值：变了就是一个新的 Set） */
  readonly expanded: ReadonlySet<MenuKey>;
  /** 用户点开 / 收起，会发 expand 事件 */
  toggleExpand(item: MenuItem): void;
  /** 程序性展开（跟随当前项、初始全展开），不发事件；已经展开就什么都不做 */
  expand(key: MenuKey): void;
  /** 点击或回车：叶子项设为当前项，有子菜单的项切换展开 */
  activate(item: MenuItem, hasChildren: boolean, event: MouseEvent | KeyboardEvent): void;
  /** 方向键移焦点：只在看得见的项之间移动 */
  moveFocus(from: HTMLElement, target: MenuFocusTarget): void;
  /** 传 data 时的文字渲染：用户给了自定义渲染就走它，否则直出 label */
  renderLabel(scope: MenuLabelScope): Label;
}

/** 父菜单项给子项的上下文：层级 + 后代登记（祖先要知道当前项在不在自己下面） */
export interface MenuParentContextValue {
  readonly level: number;
  register(key: MenuKey): void;
  unregister(key: MenuKey): void;
}

/** 根层：一级项的 level 是 0；根不用记后代。引用恒定，两个壳都拿它当默认值 */
export const MENU_ROOT_PARENT: MenuParentContextValue = {
  level: 0,
  register: () => {},
  unregister: () => {},
};

/** 两个壳的报错文案保持一致 */
export const MENU_CONTEXT_ERROR = "MMenuItem 只能放在 MMenu 里用";

/**
 * 后代登记表里的一条：只要 uid。
 * uid 是 `String(key)` —— 登记表的 uid 是字符串，而菜单的 key 允许是数字。
 * （极端情况下数字 1 和字符串 "1" 会撞成一条，同一棵菜单里不要这么混着用。）
 */
export type MenuDescendant = { readonly uid: string };

export type MenuDescendants = Registry<MenuDescendant>;

export function createMenuDescendants(): MenuDescendants {
  return createRegistry<MenuDescendant>();
}

export function menuDescendantUid(key: MenuKey): string {
  return String(key);
}

/** 当前项在不在这一支下面 */
export function menuHasDescendant(
  snapshot: RegistrySnapshot<MenuDescendant>,
  key: MenuKey | undefined,
): boolean {
  if (key === undefined) return false;
  const uid = menuDescendantUid(key);
  return snapshot.items.some((item) => item.uid === uid);
}
