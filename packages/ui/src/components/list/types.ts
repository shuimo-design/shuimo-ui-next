export interface ListProps<T> {
  /** 数据；传了就逐项渲染 MListItem，不传则由默认插槽自己放 MListItem */
  data?: T[];
  /** 是否显示项目符号（墨点） */
  marker?: boolean;
  /** 所有项都用激活样式（朱砂点 + 墨圈）；数据项自带 active 字段时以它为准 */
  autoActive?: boolean;
}

export interface ListItemScope<T> {
  /** 当前项数据 */
  item: T;
  /** 当前项下标 */
  index: number;
}

export interface ListSlots<T> {
  /** 有 data 时按项调用并带上 { item, index }；没有 data 时直接渲染一次 */
  default?: (scope: ListItemScope<T>) => unknown;
}

export interface ListItemProps {
  /** 激活态：文字加重、墨点换成朱砂点外套墨圈 */
  active?: boolean;
  /** 是否显示项目符号；不传则跟随 MList */
  marker?: boolean;
}

export interface ListItemEmits {
  click: [event: MouseEvent];
}

export interface ListItemSlots {
  default?: () => unknown;
}
