export type MenuKey = string | number;

export interface MenuItemData {
  /** 菜单项唯一标识，也是 v-model 里记的值 */
  key?: MenuKey;
  /** 菜单项文字 */
  label?: string;
  /** 子菜单 */
  children?: MenuItemData[];
  /** 禁用：不能点、不能选中 */
  disabled?: boolean;
  /** 用 fieldNames 映射时，实际字段名任意 */
  [field: string]: unknown;
}

export interface MenuFieldNames {
  /** 取 key 的字段名，默认 "key" */
  key?: string;
  /** 取文字的字段名，默认 "label" */
  label?: string;
  /** 取子菜单的字段名，默认 "children" */
  children?: string;
  /** 取禁用态的字段名，默认 "disabled" */
  disabled?: string;
}

/** 事件和插槽里拿到的菜单项 */
export interface MenuItem {
  key: MenuKey;
  label: string;
  disabled: boolean;
  /** 层级，一级项为 0 */
  level: number;
  /** 传 data 时的原始数据；手写 MMenuItem 的没有 */
  data?: MenuItemData;
}

export interface MenuLabelScope {
  item: MenuItem;
  level: number;
}

export interface MenuProps {
  /** 菜单数据；不传则用默认插槽手写 MMenuItem */
  data?: MenuItemData[];
  /** 字段名映射 */
  fieldNames?: MenuFieldNames;
  /** 初始展开全部子菜单 */
  defaultExpandAll?: boolean;
}

export interface MenuEmits {
  /** 点击菜单项（禁用项不触发）；键盘回车 / 空格也算 */
  nodeClick: [item: MenuItem, event: MouseEvent | KeyboardEvent];
  /** 当前项变化（点叶子项），参数是新 key */
  change: [key: MenuKey];
  /** 子菜单展开 / 收起 */
  expand: [item: MenuItem, expanded: boolean];
}

export interface MenuSlots {
  /** 手写的 MMenuItem */
  default?: () => unknown;
  /** 传 data 时自定义每项文字，作用域 { item, level } */
  label?: (scope: MenuLabelScope) => unknown;
}

export interface MenuItemProps {
  /** 唯一标识，对应 MMenu 的 v-model */
  name: MenuKey;
  /** 文字，也可用 label 插槽 */
  label?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 原始数据，透传到事件的 item.data 上 */
  data?: MenuItemData;
}

export interface MenuItemSlots {
  /** 子菜单：放更多 MMenuItem */
  default?: () => unknown;
  /** 自定义文字，作用域 { item, level } */
  label?: (scope: MenuLabelScope) => unknown;
}
