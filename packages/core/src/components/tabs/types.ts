export type TabName = string | number;
export type TabsType = "line" | "card";
export type TabsPosition = "top" | "bottom" | "left" | "right";

/**
 * 用 `panes` 数组声明的一页。
 *
 * 为什么是数组而不是靠子组件登记：子组件登记要在挂载后才知道顺序（旧版靠比较隐藏占位元素的
 * DOM 位置排序），React 的 effect 顺序在 Fragment / Suspense / 并发切片下不保证跟 DOM 一致，
 * 服务端更是没有 DOM。数组的顺序服务端就算得出来，两个框架、两次渲染都一致。
 *
 * `Node` 由各框架收窄成自己的可渲染类型（Vue 是 VNodeChild 或返回它的函数，React 是 ReactNode），
 * core 自己不碰这两个字段，只做透传。
 */
export interface TabPaneConfig<Node = unknown> {
  /** 标签标识，写进 v-model / value */
  name: TabName;
  /** 标签文字；labelNode 优先 */
  label?: string;
  /** 标签上的富内容，优先于 label */
  labelNode?: Node;
  /** 禁用后不能被选中 */
  disabled?: boolean;
  /** 是否显示关闭按钮；不传则跟随 MTabs 的 closable */
  closable?: boolean;
  /** 首次激活时才渲染内容，之后切走只是隐藏 */
  lazy?: boolean;
  /** 面板内容 */
  content?: Node;
}

export interface TabsProps {
  /** 每一页的配置，顺序就是标签顺序；不传则从子组件 MTabPane 上收集 */
  panes?: readonly TabPaneConfig[];
  /** 外形：line 导航条下一条笔触线 + 激活项一横朱笔指示器；card 每个标签一条签条（书签式），
   *  激活的那条纸色、朝内容区探出一截压在内容区框线上。不开水墨引擎时退回实线和 CSS 双线框 */
  type?: TabsType;
  /** 导航条位置；left / right 时标签竖着排，方向键改用上下 */
  position?: TabsPosition;
  /** 所有标签都显示关闭按钮；单页可用自己的 closable 覆盖 */
  closable?: boolean;
  /** 标签平分导航条宽度 */
  stretch?: boolean;
  /** 整组禁用：所有标签不可切换、不可关闭 */
  disabled?: boolean;
}

export interface TabsEmits {
  /** 激活的标签变化 */
  change: [name: TabName];
  /** 点了某个标签（不管有没有真的切换） */
  tabClick: [name: TabName, event: MouseEvent];
  /** 点了某个标签的关闭按钮；组件不会自己删 pane，由使用方处理 */
  tabRemove: [name: TabName];
}

export interface TabsSlots {
  /** 放 MTabPane（语法糖；传了 panes 就不看这里） */
  default?: () => unknown;
  /** 导航条末尾（横排时靠右，竖排时靠下）的附加内容 */
  extra?: () => unknown;
}

export interface TabPaneProps {
  /** 标签标识，写进 MTabs 的 v-model；不传则按书写顺序自动生成 */
  name?: TabName;
  /** 标签文字；label 插槽优先 */
  label?: string;
  /** 禁用后不能被选中 */
  disabled?: boolean;
  /** 是否显示关闭按钮；不传则跟随 MTabs */
  closable?: boolean;
  /** 首次激活时才渲染内容，之后切走只是隐藏 */
  lazy?: boolean;
}

export interface TabPaneSlots {
  /** 面板内容 */
  default?: () => unknown;
  /** 导航条上的标签内容，优先于 label */
  label?: () => unknown;
}
