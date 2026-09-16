/**
 * 通知卡的无框架部分：类名、墨迹变量。
 * 行为（倒计时、悬停暂停、进出场动画）在 item-controller.ts，
 * 队列（函数式 API 那一套）在 overlay/notification-queue.ts。
 */
import { inkBadgeUrl, type InkBadgeKind } from "../../ink/assets/badge";
import { inkShapeUrl } from "../../ink/assets/shape";
import type { NotificationPlacement, NotificationType } from "./types";

export type * from "./types";
export {
  createNotificationItem,
  type NotificationItemController,
  type NotificationItemOptions,
  type NotificationItemSnapshot,
} from "./item-controller";

/** 关闭按钮的无障碍名，两个壳必须一致 */
export const NOTIFICATION_CLOSE_LABEL = "关闭";
/** 栈容器的无障碍名 */
export const NOTIFICATION_LIST_LABEL = "通知";
/** 默认停留时长 ms */
export const NOTIFICATION_DURATION = 4500;

/** 类型 → 徽记里那个记号，和 MMessage / MAlert 用的是同一套素材 */
const BADGE: Record<NotificationType, InkBadgeKind> = {
  success: "check",
  warning: "bang",
  error: "cross",
  info: "info",
};

/** 四个角，顺序固定：出口按它渲染栈容器，两个壳的 DOM 顺序才一致 */
export const NOTIFICATION_PLACEMENTS: readonly NotificationPlacement[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
];

export function notificationListClasses(placement: NotificationPlacement): string[] {
  return ["m-notification-list", `m-notification-list--${placement}`];
}

export function notificationClasses(options: {
  type?: NotificationType;
  placement: NotificationPlacement;
  closable: boolean;
  closing: boolean;
}): string[] {
  const classes = ["m-notification", `m-notification--${options.placement}`];
  if (options.type) classes.push(`m-notification--${options.type}`);
  if (options.closable) classes.push("m-notification--closable");
  if (options.closing) classes.push("m-notification--closing");
  return classes;
}

/** 错误要打断读屏（alert），其余的等读屏空下来再念（status） */
export function notificationRole(type: NotificationType | undefined): "alert" | "status" {
  return type === "error" ? "alert" : "status";
}

/**
 * 根元素上的内联变量。毛边纸按通知实际尺寸生成（生成器自己按 8px 分桶缓存），
 * 还没量到尺寸（服务端、首帧）就不给这几个变量，CSS 那边有兜底。
 */
export function notificationStyle(options: {
  type?: NotificationType;
  seed: number;
  width: number;
  height: number;
}): Record<string, string | undefined> {
  const { type, seed, width, height } = options;
  const shape =
    width && height
      ? inkShapeUrl(width, height, { seed, raggedness: 0.6, corner: 0.08 })
      : undefined;
  return {
    "--m-notification-badge": type ? `url("${inkBadgeUrl(BADGE[type], { seed })}")` : undefined,
    "--m-notification-shape": shape ? `url("${shape.url}")` : undefined,
    "--m-notification-shape-pad": shape ? `${shape.padding}px` : undefined,
  };
}
