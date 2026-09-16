export type NotificationType = "success" | "info" | "warning" | "error";

/** 四个角，通知按角各排一栈 */
export type NotificationPlacement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export interface NotificationProps {
  /** 标题 */
  title: string;
  /** 正文；也可以用默认插槽 */
  content?: string;
  /** 类型，决定左侧徽记与配色；不传就没有徽记 */
  type?: NotificationType;
  /** 自动关闭的毫秒数，默认 4500；0 表示不自动关闭 */
  duration?: number;
  /** 显示关闭按钮，默认 true */
  closable?: boolean;
  /** 出现在哪个角，默认 top-right；决定进出场方向 */
  placement?: NotificationPlacement;
  /** 墨迹种子，默认 1 */
  seed?: number;
}

export interface NotificationEmits {
  /** 离场动画结束、可以从 DOM 移除时 */
  close: [];
}

export interface NotificationSlots {
  /** 替代 content */
  default?: () => unknown;
  /** 替代类型徽记 */
  icon?: () => unknown;
}

/** 函数式调用的配置：传字符串就是 title */
export type NotificationConfig =
  | string
  | (NotificationProps & {
      /** 这条通知被移除后调用 */
      onClose?: () => void;
    });

export interface NotificationHandle {
  /** 手动关闭这条通知 */
  close(): void;
  /** 离场动画结束、通知被移除后 resolve */
  closed: Promise<void>;
}

export interface NotificationApi {
  /** 弹一条通知 */
  open(config: NotificationConfig): NotificationHandle;
  success(config: NotificationConfig): NotificationHandle;
  info(config: NotificationConfig): NotificationHandle;
  warning(config: NotificationConfig): NotificationHandle;
  error(config: NotificationConfig): NotificationHandle;
  /** 关闭全部通知；传 placement 只关那个角的 */
  closeAll(placement?: NotificationPlacement): void;
  /** 再建一套独立的通知队列（要另外给它配一个出口） */
  create(): NotificationApi;
}
