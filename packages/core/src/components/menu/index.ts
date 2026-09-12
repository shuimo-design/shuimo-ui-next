/**
 * 菜单的无框架部分：建树、展开集合运算、键盘动作、左侧竖线的笔触参数、class 派生，
 * 以及"看得见的菜单项"的查找 —— 那一段是真的在查 DOM，但它只碰 DOM，不碰框架，所以归 core。
 *
 * 为什么键盘导航要查 DOM 而不像树那样遍历数据：菜单项可以是用户手写的 MMenuItem（嵌套 JSX / 模板），
 * 根组件手里没有这棵树，只有 DOM 里那一串 `[role="menuitem"]`。收起的子菜单带 inert，
 * 用 `closest("[inert]")` 一整支跳过，正好就是"看得见的行"。
 * 壳里不许出现 querySelectorAll，所以这一段整个留在这里。
 */
import { brushLineUrl } from "../../ink/assets/line";
import type { MenuFieldNames, MenuFocusTarget, MenuItemData, MenuKey, MenuTreeNode } from "./types";

export type {
  MenuEmits,
  MenuFieldNames,
  MenuFocusTarget,
  MenuItem,
  MenuItemData,
  MenuItemProps,
  MenuItemSlots,
  MenuKey,
  MenuLabelScope,
  MenuProps,
  MenuSlots,
  MenuTreeNode,
} from "./types";

/* ---------- 数据整理 ---------- */

export interface MenuFields {
  key: string;
  label: string;
  children: string;
  disabled: string;
}

export function resolveMenuFields(fieldNames: MenuFieldNames | undefined): MenuFields {
  return {
    key: fieldNames?.key ?? "key",
    label: fieldNames?.label ?? "label",
    children: fieldNames?.children ?? "children",
    disabled: fieldNames?.disabled ?? "disabled",
  };
}

function isDataList(value: unknown): value is MenuItemData[] {
  return Array.isArray(value);
}

/** 没 key 的项按路径补一个，保证展开态和当前项都能记住 */
export function buildMenuNodes(
  items: readonly MenuItemData[],
  fields: MenuFields,
  path = "",
): MenuTreeNode[] {
  return items.map((raw, index) => {
    const rawKey = raw[fields.key];
    const key =
      typeof rawKey === "string" || typeof rawKey === "number" ? rawKey : `${path}${index}`;
    const children = raw[fields.children];
    return {
      key,
      label: String(raw[fields.label] ?? ""),
      disabled: Boolean(raw[fields.disabled]),
      children: isDataList(children) ? buildMenuNodes(children, fields, `${key}-`) : [],
      data: raw,
    };
  });
}

/* ---------- 展开集合运算 ---------- */

/**
 * 加一个 key。**已经在里面就原样返回 keys**（引用相同）——
 * 壳靠这个判断要不要写回双向绑定：程序性展开每次渲染后都会跑一遍，
 * 不做这层判断的话 React 会在 effect 里把自己抖成死循环。
 */
export function addMenuKey(keys: readonly MenuKey[], key: MenuKey): MenuKey[] {
  return keys.includes(key) ? (keys as MenuKey[]) : [...keys, key];
}

export function toggleMenuKey(keys: readonly MenuKey[], key: MenuKey): MenuKey[] {
  return keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
}

/* ---------- 键盘 ---------- */

export interface MenuKeyAction {
  /** 要不要吃掉这次按键 */
  prevent: boolean;
  kind: "none" | "focus" | "toggle" | "activate";
  /** kind 为 focus 时，往哪儿挪 */
  target?: MenuFocusTarget;
}

const NO_ACTION: MenuKeyAction = { prevent: false, kind: "none" };
/** 吃掉按键但什么也不做（禁用项按右键展不开，但也别让页面跟着滚） */
const SWALLOW: MenuKeyAction = { prevent: true, kind: "none" };

export interface MenuKeyState {
  hasChildren: boolean;
  expanded: boolean;
  disabled: boolean;
}

/** 菜单项上按一个键该做什么。纯函数，不碰 DOM */
export function menuKeyAction(key: string, state: MenuKeyState): MenuKeyAction {
  switch (key) {
    case "ArrowDown":
      return { prevent: true, kind: "focus", target: "next" };
    case "ArrowUp":
      return { prevent: true, kind: "focus", target: "prev" };
    case "Home":
      return { prevent: true, kind: "focus", target: "first" };
    case "End":
      return { prevent: true, kind: "focus", target: "last" };
    case "ArrowRight":
      if (!state.hasChildren) return NO_ACTION;
      if (state.expanded) return { prevent: true, kind: "focus", target: "next" };
      return state.disabled ? SWALLOW : { prevent: true, kind: "toggle" };
    case "ArrowLeft":
      if (state.expanded && !state.disabled) return { prevent: true, kind: "toggle" };
      return { prevent: true, kind: "focus", target: "parent" };
    case "Enter":
    case " ":
      return { prevent: true, kind: "activate" };
    default:
      return NO_ACTION;
  }
}

/** 菜单项那一行（可聚焦的那个元素） */
const ROW_SELECTOR = '[role="menuitem"]';
const ITEM_SELECTOR = ".m-menu-item";

/** 看得见的菜单项行，按屏幕顺序；收起的子菜单带 inert，整支跳过 */
export function menuVisibleRows(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>(ROW_SELECTOR)].filter(
    (row) => !row.closest("[inert]"),
  );
}

/** 方向键移焦点：只在看得见的项之间移动 */
export function moveMenuFocus(
  root: HTMLElement | null,
  from: HTMLElement,
  target: MenuFocusTarget,
): void {
  if (target === "parent") {
    // 自己所在的 li 往上找到父项的 li，再取它自己那一行
    const parentItem = from.closest(ITEM_SELECTOR)?.parentElement?.closest(ITEM_SELECTOR);
    parentItem?.querySelector<HTMLElement>(`:scope > ${ROW_SELECTOR}`)?.focus();
    return;
  }
  const rows = menuVisibleRows(root);
  const index = rows.indexOf(from);
  const at =
    target === "first"
      ? 0
      : target === "last"
        ? rows.length - 1
        : target === "next"
          ? index + 1
          : index - 1;
  rows[at]?.focus();
}

/* ---------- class 与样式 ---------- */

export interface MenuItemState {
  /** 一级项 */
  root: boolean;
  /** 自己就是当前项 */
  current: boolean;
  /** 当前项在这一支下面（含自己） */
  active: boolean;
  expanded: boolean;
  disabled: boolean;
}

/** 菜单项的类名。两个壳都调它，才保证输出的字符串一模一样（顺序也一样） */
export function menuItemClasses(state: MenuItemState): string {
  const list = ["m-menu-item"];
  if (state.root) list.push("m-menu-item--root");
  if (state.current) list.push("m-menu-item--current");
  if (state.active) list.push("m-menu-item--active");
  if (state.expanded) list.push("m-menu-item--expanded");
  if (state.disabled) list.push("m-menu-item--disabled");
  return list.join(" ");
}

/**
 * 左侧那一笔的画幅长度：按菜单实际高度算，但按 32px 分桶，
 * 免得高度每变一像素就重画一张 SVG。高度量不出来（服务端、水合首帧）时按最短的一档算。
 */
export function menuLineLength(height: number): number {
  return Math.max(64, Math.ceil(height / 32) * 32);
}

/** 竖线的遮罩与画幅宽度，写成根上的 CSS 变量交给 m.ink 层 */
export function menuInkStyle(height: number): Record<string, string> {
  const line = brushLineUrl({
    seed: 3,
    vertical: true,
    length: menuLineLength(height),
    thickness: 2,
    wobble: 1,
  });
  return {
    "--m-menu-line-mask": `url("${line.url}")`,
    "--m-menu-line-band": `${line.width}px`,
  };
}
