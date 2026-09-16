import { notification, notificationApi } from "@shuimo-design/core";
import MNotificationSfc from "./MNotification.vue";

/**
 * 组件本体，同时挂着函数式调用：MNotification.success({ title })、MNotification.open({ ... })。
 * 队列在 core，这里只是把它的几个方法挂到组件上；
 * 通知由 `<MOverlayOutlet>`（`<MConfigProvider>` 自带）渲染在用户自己的树里。
 */
export const MNotification = Object.assign(MNotificationSfc, notificationApi(notification));
// 队列本体也转出去：要建独立队列、或者自己写出口时用得上
export { notification, notificationApi, createNotificationQueue } from "@shuimo-design/core";
export type {
  NotificationApi,
  NotificationConfig,
  NotificationEmits,
  NotificationEntry,
  NotificationGroup,
  NotificationHandle,
  NotificationPlacement,
  NotificationProps,
  NotificationQueue,
  NotificationQueueSnapshot,
  NotificationSlots,
  NotificationType,
} from "@shuimo-design/core";
