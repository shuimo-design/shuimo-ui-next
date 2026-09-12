import { message, messageApi } from "@shuimo-design/core";
import { MMessage as MMessageComponent } from "./MMessage";

/** 组件本体，同时挂着函数式调用：MMessage.success("...")、MMessage.show({ ... }) */
export const MMessage = Object.assign(MMessageComponent, messageApi(message));
export type { MMessageProps } from "./MMessage";
// 队列本体也转出去：要建独立队列、或者自己写出口时用得上
export { message, messageApi, createMessageQueue } from "@shuimo-design/core";
export type {
  MessageApi,
  MessageConfig,
  MessageDirection,
  MessageEntry,
  MessageGroup,
  MessageHandle,
  MessageQueue,
  MessageQueueSnapshot,
  MessageType,
} from "@shuimo-design/core";
