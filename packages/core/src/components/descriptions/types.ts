/** 标签和值的排法：horizontal 同一行左右并排，vertical 标签一行、值在下一行 */
export type DescriptionsLayout = "horizontal" | "vertical";
export type DescriptionsSize = "sm" | "md" | "lg";

/** 一条描述 */
export interface DescriptionsItem {
  /** 渲染用的 key，不传按下标 */
  key?: string | number;
  /** 标签 */
  label: string;
  /** 值；不传显示空 */
  value?: string | number;
  /** 占几列，默认 1；超过列数截到列数，超过本行剩余列数截到剩余 */
  span?: number;
}

/** 作用域插槽 label / value 收到的东西 */
export interface DescriptionsItemScope {
  /** 这一条的数据 */
  item: DescriptionsItem;
}

/**
 * 配置数组里的一条：数据之外，子组件写法收集来的插槽也放在这里。
 * `Node` 由各框架收窄成自己的可渲染类型（Vue 是 VNodeChild，React 是 ReactNode）。
 */
export interface DescriptionsItemConfig<Node = unknown> extends DescriptionsItem {
  /** 自定义值（子组件的默认插槽） */
  render?: () => Node;
  /** 自定义标签（子组件的 label 插槽） */
  renderLabel?: () => Node;
}

export interface DescriptionsProps {
  /** 数据；不传则从子组件 MDescriptionsItem 上按书写顺序收集 */
  items?: readonly DescriptionsItem[];
  /** 标题；title 插槽优先 */
  title?: string;
  /** 一行几列，默认 3 */
  column?: number;
  /** 画格线：外框、行线、列线，标签格铺一层淡墨 */
  bordered?: boolean;
  /** 标签和值的排法，默认 horizontal */
  layout?: DescriptionsLayout;
  /** 格子的内边距档位，默认 md */
  size?: DescriptionsSize;
  /** 标签后面带冒号，默认 true；只在 horizontal 且不带格线时显示 */
  colon?: boolean;
}

export interface DescriptionsSlots {
  /** 放 MDescriptionsItem（语法糖；传了 items 就不看这里） */
  default?: () => unknown;
  /** 标题，优先于 title */
  title?: () => unknown;
  /** 标题右侧的操作区 */
  extra?: () => unknown;
  /** 自定义标签，作用域 { item } */
  label?: (scope: DescriptionsItemScope) => unknown;
  /** 自定义值，作用域 { item } */
  value?: (scope: DescriptionsItemScope) => unknown;
}

/** MDescriptionsItem 的 props：和数据项一样，key 由框架接管所以不在这里 */
export type DescriptionsItemProps = Omit<DescriptionsItem, "key">;

export interface DescriptionsItemSlots {
  /** 值，优先于 value */
  default?: () => unknown;
  /** 标签，优先于 label */
  label?: () => unknown;
}
