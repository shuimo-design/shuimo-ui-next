/** 轴线放哪边：left 轴在左、内容在右；right 反过来；alternate 内容左右交替 */
export type TimelineMode = "left" | "right" | "alternate";

/** 节点的语义色：primary 花青、success 石绿、warn 藤黄、danger 朱砂、muted 灰；不传是墨色 */
export type TimelineType = "primary" | "success" | "warn" | "danger" | "muted";

/** 一条时间线数据 */
export interface TimelineItem {
  /** 渲染用的 key，不传按下标 */
  key?: string | number;
  /** 时间或标题，节点旁的第一行 */
  label?: string;
  /** 正文，label 下面 */
  content?: string;
  /** 节点颜色 */
  type?: TimelineType;
  /** 节点里的文字（一个字为宜）；传了节点从墨点变成带字的圈 */
  dot?: string;
}

/** 作用域插槽 dot / item 收到的东西 */
export interface TimelineItemScope {
  /** 这一条的数据 */
  item: TimelineItem;
  /** 在 items 里的下标（reverse 不影响） */
  index: number;
}

/**
 * 配置数组里的一条：数据之外，子组件写法收集来的插槽也放在这里。
 * `Node` 由各框架收窄成自己的可渲染类型（Vue 是 VNodeChild，React 是 ReactNode）。
 */
export interface TimelineItemConfig<Node = unknown> extends TimelineItem {
  /** 自定义整条内容（子组件的默认插槽） */
  render?: () => Node;
  /** 自定义节点（子组件的 dot 插槽） */
  renderDot?: () => Node;
}

export interface TimelineProps {
  /** 数据；不传则从子组件 MTimelineItem 上按书写顺序收集 */
  items?: readonly TimelineItem[];
  /** 轴线位置，默认 left */
  mode?: TimelineMode;
  /** 末尾加一个幽灵节点和一段虚线，表示还在进行；传字符串就是幽灵节点旁的文字 */
  pending?: boolean | string;
  /** 倒序排列；幽灵节点跟着挪到最前 */
  reverse?: boolean;
  /** 轴线笔触的随机种子 */
  seed?: number;
}

export interface TimelineSlots {
  /** 放 MTimelineItem（语法糖；传了 items 就不看这里） */
  default?: () => unknown;
  /** 自定义节点，作用域 { item, index } */
  dot?: (scope: TimelineItemScope) => unknown;
  /** 自定义整条内容，作用域 { item, index } */
  item?: (scope: TimelineItemScope) => unknown;
}

/** MTimelineItem 的 props：和数据项一样，key 由框架接管所以不在这里 */
export type TimelineItemProps = Omit<TimelineItem, "key">;

export interface TimelineItemSlots {
  /** 整条内容，优先于 label / content */
  default?: () => unknown;
  /** 节点，优先于 dot */
  dot?: () => unknown;
}
