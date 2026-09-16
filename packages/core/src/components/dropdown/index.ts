/**
 * 下拉菜单的无框架部分。开合时序在 overlay/popover-trigger.ts、定位在 overlay/floating.ts、
 * 焦点搬运在 overlay/popover-focus.ts；这里只剩 class 派生、按键 → 动作的查表，
 * 以及"在菜单项之间挪焦点"—— 那一段查 DOM 但不碰框架，所以归 core。
 */
import { POPOVER_BORDER_STROKE } from "../popover";
import type { DropdownItem } from "./types";

export type {
  DropdownEmits,
  DropdownItem,
  DropdownItemScope,
  DropdownKey,
  DropdownPlacement,
  DropdownProps,
  DropdownSlots,
  DropdownTrigger,
} from "./types";

/** 菜单的框和气泡是同一支笔 */
export const DROPDOWN_BORDER_STROKE = POPOVER_BORDER_STROKE;

export function dropdownClasses(state: {
  wrapOnly: boolean;
  open: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-dropdown",
    ...(state.wrapOnly ? ["m-dropdown--wrap"] : []),
    ...(state.open ? ["m-dropdown--open"] : []),
    ...(state.disabled ? ["m-dropdown--disabled"] : []),
  ];
}

export function dropdownItemClasses(item: Pick<DropdownItem, "disabled" | "danger">): string[] {
  return [
    "m-dropdown__item",
    ...(item.disabled ? ["m-dropdown__item--disabled"] : []),
    ...(item.danger ? ["m-dropdown__item--danger"] : []),
  ];
}

/**
 * 参照元素上的 aria：这是一个「带菜单的按钮」，点开的和悬停出来的都算，
 * 所以和气泡不同，这里不区分触发方式。返回 undefined 的属性要摘掉。
 */
export function dropdownReferenceAria(state: { open: boolean; menuId: string }): {
  "aria-haspopup": string;
  "aria-expanded": string;
  "aria-controls"?: string;
} {
  return {
    "aria-haspopup": "menu",
    "aria-expanded": String(state.open),
    ...(state.open ? { "aria-controls": state.menuId } : {}),
  };
}

/** dropdownReferenceAria 管的那几个属性，用来在参照元素换人时逐个摘干净 */
export const DROPDOWN_REFERENCE_ARIA = ["aria-haspopup", "aria-expanded", "aria-controls"] as const;

/* ---------- 键盘 ---------- */

export type DropdownFocusTarget = "first" | "last" | "next" | "prev";

export interface DropdownKeyAction {
  /** 要不要吃掉这次按键 */
  prevent: boolean;
  kind: "none" | "focus" | "select" | "close";
  /** kind 为 focus 时，往哪儿挪 */
  target?: DropdownFocusTarget;
}

const NO_ACTION: DropdownKeyAction = { prevent: false, kind: "none" };

/** 菜单项上按一个键该做什么。纯函数，不碰 DOM */
export function dropdownMenuKeyAction(key: string): DropdownKeyAction {
  switch (key) {
    case "ArrowDown":
      return { prevent: true, kind: "focus", target: "next" };
    case "ArrowUp":
      return { prevent: true, kind: "focus", target: "prev" };
    case "Home":
      return { prevent: true, kind: "focus", target: "first" };
    case "End":
      return { prevent: true, kind: "focus", target: "last" };
    case "Enter":
    case " ":
      return { prevent: true, kind: "select" };
    case "Escape":
      // 收起由 popover-trigger 在 document 上听 Escape 完成，这里只负责把焦点还回去
      return { prevent: false, kind: "close" };
    default:
      return NO_ACTION;
  }
}

/** 触发元素上按一个键该做什么：只认向下箭头（打开并聚焦第一项） */
export function dropdownTriggerKeyAction(key: string): DropdownKeyAction {
  return key === "ArrowDown" ? { prevent: true, kind: "focus", target: "first" } : NO_ACTION;
}

const ITEM_SELECTOR = '[role="menuitem"]';

/** 菜单里的所有项，按屏幕顺序；禁用项也在里面 —— 读屏用户要能走到它、听到它是禁用的 */
export function dropdownItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? [...menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)] : [];
}

/** 方向键移焦点：上下循环，Home / End 到两端 */
export function moveDropdownFocus(
  menu: HTMLElement | null,
  from: HTMLElement | null,
  target: DropdownFocusTarget,
): void {
  const items = dropdownItems(menu);
  if (items.length === 0) return;
  const index = from ? items.indexOf(from) : -1;
  const last = items.length - 1;
  let at: number;
  if (target === "first") at = 0;
  else if (target === "last") at = last;
  else if (target === "next") at = index >= last ? 0 : index + 1;
  else at = index <= 0 ? last : index - 1;
  items[at]?.focus({ preventScroll: true });
}

/** 菜单挂上时焦点落在第一项 */
export function dropdownFirstItem(menu: HTMLElement): HTMLElement | null {
  return menu.querySelector<HTMLElement>(ITEM_SELECTOR);
}
