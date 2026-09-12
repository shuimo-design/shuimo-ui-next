export type AlertType = "success" | "warn" | "danger" | "info";
export type AlertEffect = "light" | "dark";

export interface AlertProps {
  /** 语义类型：success 石绿、warn 藤黄、danger 朱砂、info 花青，默认 info */
  type?: AlertType;
  /** 标题 */
  title?: string;
  /** 辅助说明，也可用默认插槽 */
  description?: string;
  /** 显示关闭按钮，默认 true */
  closable?: boolean;
  /** 显示状态徽记，默认 true */
  showIcon?: boolean;
  /** 文字居中 */
  center?: boolean;
  /** light 淡底 + 语义色边和徽记；dark 语义色底 + 白字，默认 light */
  effect?: AlertEffect;
  /** 左侧笔触线和徽记的随机种子 */
  seed?: number;
}

export interface AlertEmits {
  /** 点了关闭按钮；随后组件自己隐藏 */
  close: [event: MouseEvent];
}

export interface AlertSlots {
  /** 说明文字，优先于 description */
  default?: () => unknown;
  /** 标题，优先于 title */
  title?: () => unknown;
  /** 替换状态徽记 */
  icon?: () => unknown;
  /** 右侧操作区（按钮、链接） */
  action?: () => unknown;
}
