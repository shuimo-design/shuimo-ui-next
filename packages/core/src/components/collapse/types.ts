export type CollapseName = string | number;

/**
 * 对外那个 v-model 的取值：手风琴是单个 name（全收起是 undefined），普通模式是 name 数组。
 * 壳层把 Accordion 接到 accordion 属性、Name 接到 v-model 上，`<MCollapse accordion v-model="x">`
 * 就推成单个值，不写 accordion 就推成数组。不带参数用是两种形状的并集，和以前一样
 */
// 分支顺序有讲究：TS 推 Name 时会对两个分支都取候选并按顺序取第一个，`Name | undefined`
// 这种裸分支会把整个 string[] 当成候选；数组分支放前面，v-model 绑 ref<string[]> 才能推出 string
export type CollapseModel<
  Accordion extends boolean = boolean,
  Name extends CollapseName = CollapseName,
> = Accordion extends false ? Name[] : Name | undefined;

export interface CollapseProps<Accordion extends boolean = boolean> {
  /** 手风琴：同一时刻只展开一项；此时 v-model 是单个 name，否则是 name 数组 */
  accordion?: Accordion;
  /** 标题右侧画一条笔触线延伸到边缘（旧版的 line）；单项可用自己的 divider 覆盖 */
  divider?: boolean;
  /** 整组禁用 */
  disabled?: boolean;
}

export interface CollapseEmits<
  Accordion extends boolean = boolean,
  Name extends CollapseName = CollapseName,
> {
  /** 展开项变化；accordion 下是单个 name（全部收起时为 undefined），否则是数组 */
  change: [active: CollapseModel<Accordion, Name>];
}

export interface CollapseSlots {
  /** 放 MCollapseItem */
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
