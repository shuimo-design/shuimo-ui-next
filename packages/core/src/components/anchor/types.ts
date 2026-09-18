/** 一条锚点 */
export interface AnchorItem {
  /** 目标的 `#id` */
  href: string;
  /** 显示的文字 */
  title: string;
  /** 子锚点，缩进一级 */
  children?: AnchorItem[];
}

/** 监听哪个容器的滚动：CSS 选择器、元素本身、或一个返回元素的函数；不传是整页 */
export type AnchorContainer = string | HTMLElement | (() => HTMLElement | null);

/** 排布方向：vertical 竖排一列（默认），horizontal 横排一行、子锚点不缩进 */
export type AnchorDirection = "vertical" | "horizontal";

/** 作用域插槽 item 收到的东西 */
export interface AnchorItemScope {
  /** 这一条的数据 */
  item: AnchorItem;
  /** 是当前激活项 */
  active: boolean;
}

export interface AnchorProps {
  /** 锚点列表，children 嵌套一级缩进一级 */
  items: readonly AnchorItem[];
  /** 监听哪个容器的滚动，默认整页 */
  container?: AnchorContainer;
  /** 激活判定的顶部偏移 px：目标顶边越过容器顶边下方这么多就算到了，默认 0 */
  offset?: number;
  /** 点击滚动后目标距容器顶边的距离 px，默认等于 offset */
  targetOffset?: number;
  /** 点击平滑滚动，默认 true；减弱动效时一律瞬时到位 */
  smooth?: boolean;
  /** 吸顶：`position: sticky`，top 取 offset，默认 false */
  affix?: boolean;
  /** 排布方向，默认 vertical */
  direction?: AnchorDirection;
  /** 点击后把 href 写进地址栏（replaceState），默认 false */
  updateHash?: boolean;
  /** 指示线笔触的随机种子，默认 1 */
  seed?: number;
}

export interface AnchorEmits {
  /** 激活项变化（滚动到、或点击） */
  change: [href: string];
  /** 点了某条锚点；默认行为已拦下，滚动由组件做 */
  click: [href: string, event: MouseEvent];
}

export interface AnchorSlots {
  /** 自定义每条的内容，作用域 { item, active } */
  item?: (scope: AnchorItemScope) => unknown;
}
