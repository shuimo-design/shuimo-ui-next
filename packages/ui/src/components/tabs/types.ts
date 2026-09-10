export type TabName = string | number;
export type TabsType = "line" | "card";
export type TabsPosition = "top" | "bottom" | "left" | "right";

export interface TabsProps {
  /** 外形：line 导航条下一条笔触线 + 激活项一横朱笔指示器；card 每个标签一条签条（书签式），
   *  激活的那条纸色、朝内容区探出一截压在内容区框线上。不开水墨引擎时退回实线和 CSS 双线框 */
  type?: TabsType;
  /** 导航条位置；left / right 时标签竖着排，方向键改用上下 */
  position?: TabsPosition;
  /** 所有标签都显示关闭按钮；单个 MTabPane 可用自己的 closable 覆盖 */
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
  /** 放 MTabPane */
  default?: () => unknown;
  /** 导航条末尾（横排时靠右，竖排时靠下）的附加内容 */
  extra?: () => unknown;
}

export interface TabPaneProps {
  /** 标签标识，写进 MTabs 的 v-model；不传则自动生成 */
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
