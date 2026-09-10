export type CollapseName = string | number;

export interface CollapseProps {
  /** 手风琴：同一时刻只展开一项；此时 v-model 是单个 name，否则是 name 数组 */
  accordion?: boolean;
  /** 标题右侧画一条笔触线延伸到边缘（旧版的 line）；单项可用自己的 divider 覆盖 */
  divider?: boolean;
  /** 整组禁用 */
  disabled?: boolean;
}

export interface CollapseEmits {
  /** 展开项变化；accordion 下是单个 name（全部收起时为 undefined），否则是数组 */
  change: [active: CollapseName | CollapseName[] | undefined];
}

export interface CollapseSlots {
  default?: () => unknown;
}

export interface CollapseItemProps {
  /** 项的标识，写进 MCollapse 的 v-model；不传则自动生成（单独使用时用不到） */
  name?: CollapseName;
  /** 标题文字；title 插槽优先 */
  title?: string;
  /** 禁用后不能展开 / 收起 */
  disabled?: boolean;
  /** 标题右侧是否画笔触线；不传则跟随 MCollapse（默认画） */
  divider?: boolean;
}

export interface CollapseItemEmits {
  /** 单独使用（不在 MCollapse 里）时展开 / 收起的变化 */
  change: [expanded: boolean];
}

export interface CollapseItemSlots {
  /** 标题区 */
  title?: () => unknown;
  /** 展开后的内容 */
  default?: () => unknown;
}
