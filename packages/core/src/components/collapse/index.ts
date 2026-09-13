/**
 * 折叠面板的无框架部分：class 派生、标题后那一笔的笔触参数、一对无障碍 id 的拼法。
 * 展开项的增删（含手风琴模式只留一项）在 context/collapse.ts。
 * Vue 和 React 的折叠面板各自只剩模板和事件绑定，这里的东西两边一字不差地共用。
 */
import type { BrushLineControllerOptions } from "../divider";
import type { CollapseName } from "./types";

export type { CollapseItemProps, CollapseModel, CollapseName, CollapseProps } from "./types";

/**
 * 标题右侧那一笔按剩余宽度单独生成：标题长短不同，线的长度就不同，
 * 拿通用长线硬压会糊成发丝。这里只给参数，量长度和生成交给 createBrushLine。
 */
const LINE: BrushLineControllerOptions = { thickness: 2, vertical: false, seed: 3 };

export function collapseLineOptions(): BrushLineControllerOptions {
  return LINE;
}

export function collapseClasses(o: { disabled?: boolean }): string[] {
  return ["m-collapse", ...(o.disabled ? ["m-collapse--disabled"] : [])];
}

export function collapseItemClasses(o: {
  active: boolean;
  disabled: boolean;
  divider: boolean;
}): string[] {
  return [
    "m-collapse-item",
    ...(o.active ? ["m-collapse-item--active"] : []),
    ...(o.disabled ? ["m-collapse-item--disabled"] : []),
    ...(o.divider ? ["m-collapse-item--divider"] : []),
  ];
}

/** 标题和内容互相引用的一对 id（aria-controls / aria-labelledby），两个壳必须拼得一模一样 */
export function collapseItemIds(uid: string): { headerId: string; contentId: string } {
  return { headerId: `${uid}-header`, contentId: `${uid}-content` };
}

/** 没给 name 时用生成的 id 顶上，放进组里也能被区分 */
export function collapseItemName(name: CollapseName | undefined, uid: string): CollapseName {
  return name ?? uid;
}
