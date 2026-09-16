import type { Placement } from "@floating-ui/dom";

export type DropdownKey = string | number;
export type DropdownPlacement = Placement;
/** 下拉菜单只有点击和悬停两种触发；focus / manual 对菜单没有意义 */
export type DropdownTrigger = "click" | "hover";

export interface DropdownItem {
  /** 菜单项唯一标识，select 事件的第一个参数 */
  key: DropdownKey;
  /** 菜单项文字；有 item 插槽时被插槽覆盖 */
  label: string;
  /** 禁用：能聚焦、不能选 */
  disabled?: boolean;
  /** 这一项上方画一条分隔线 */
  divided?: boolean;
  /** 危险操作：文字用警示色 */
  danger?: boolean;
}

export interface DropdownItemScope {
  item: DropdownItem;
}

export interface DropdownProps {
  /** 菜单项 */
  items: DropdownItem[];
  /** 触发方式，默认 click */
  trigger?: DropdownTrigger;
  /** 菜单出现的方位（floating-ui placement），默认 bottom-start */
  placement?: DropdownPlacement;
  /** 禁用：不再响应触发，已打开的会收起 */
  disabled?: boolean;
  /** 菜单与触发元素的间距 px，默认 6 */
  offset?: number;
  /** 菜单传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
  /** 笔触边框的种子，默认 1 */
  seed?: number;
}

export interface DropdownEmits {
  /** 选中一项（禁用项不触发）；选中后菜单自动收起 */
  select: [key: DropdownKey, item: DropdownItem];
}

export interface DropdownSlots {
  /** 触发内容；第一个元素当参照元素 */
  default?: () => unknown;
  /** 自定义每一项的内容，作用域 { item } */
  item?: (scope: DropdownItemScope) => unknown;
}
