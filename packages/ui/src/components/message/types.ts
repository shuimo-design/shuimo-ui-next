export type MessageType = "success" | "warning" | "info" | "error";

export type MessageDirection =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

export interface MessageProps {
  /** 消息类型，决定图标与配色，默认 info */
  type?: MessageType;
  /** 消息文字；也可以用默认插槽 */
  content?: string;
  /** 自动关闭的毫秒数，默认 3000；0 或负数表示不自动关闭 */
  duration?: number;
  /** 出现的位置，默认 top-right；决定进出场方向和能往哪边拖 */
  direction?: MessageDirection;
  /** 允许拖动关闭：往屏幕外拖过三分之一松手即关，默认 true */
  dragAllow?: boolean;
  /** 显示关闭按钮，默认 false */
  closable?: boolean;
  /** 墨迹种子，默认 1 */
  seed?: number;
}

export interface MessageEmits {
  /** 离场动画结束、可以从 DOM 移除时 */
  close: [];
}

export interface MessageSlots {
  /** 替代 content */
  default?: () => unknown;
  /** 替代类型图标 */
  icon?: () => unknown;
}

/** 函数式调用的配置：传字符串就是 content */
export type MessageConfig = string | MessageProps;

export interface MessageHandle {
  /** 手动关闭这条消息 */
  close(): void;
  /** 离场动画结束、消息被移除后 resolve */
  closed: Promise<void>;
}

export interface MessageApi {
  /** 弹一条消息（等价于旧版直接调用 MMessage(config)） */
  show(config: MessageConfig): MessageHandle;
  success(config: MessageConfig, duration?: number): MessageHandle;
  warning(config: MessageConfig, duration?: number): MessageHandle;
  info(config: MessageConfig, duration?: number): MessageHandle;
  error(config: MessageConfig, duration?: number): MessageHandle;
  /** 关闭全部消息；传 direction 只关那个方向的 */
  closeAll(direction?: MessageDirection): void;
  /** 再建一套独立的消息队列（各方向的容器互不干扰） */
  create(): MessageApi;
}
