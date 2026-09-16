import { notification, notificationApi } from "@shuimo-design/core";
import { MNotification as MNotificationComponent } from "./MNotification";

/** 组件本体，同时挂着函数式调用：MNotification.success({ title })、MNotification.open({ ... }) */
export const MNotification = Object.assign(MNotificationComponent, notificationApi(notification));
export type { MNotificationProps } from "./MNotification";
// 队列本体也转出去：要建独立队列、或者自己写出口时用得上
export { notification, notificationApi, createNotificationQueue } from "@shuimo-design/core";
export type {
  NotificationApi,
  NotificationConfig,
  NotificationEntry,
  NotificationGroup,
  NotificationHandle,
  NotificationPlacement,
  NotificationQueue,
  NotificationQueueSnapshot,
  NotificationType,
} from "@shuimo-design/core";
