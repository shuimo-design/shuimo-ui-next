import { message, messageApi } from "@shuimo-design/core";
import MMessageSfc from "./MMessage.vue";

/**
 * 组件本体，同时挂着函数式调用：MMessage.success("...")、MMessage.show({ ... })。
 *
 * 和旧版的区别：队列在 core，这里只是把它的几个方法挂到组件上。
 * **`useMessage()` 已经删掉** —— 它过去唯一的用途是偷记一份 appContext 好手挂一棵树，
 * 现在消息由 `<MOverlayOutlet>`（`<MConfigProvider>` 自带）渲染在用户自己的树里，不需要那一步了。
 */
export const MMessage = Object.assign(MMessageSfc, messageApi(message));
// 队列本体也转出去：要建独立队列、或者自己写出口时用得上
export { message, messageApi, createMessageQueue } from "@shuimo-design/core";
export type {
  MessageApi,
  MessageConfig,
  MessageDirection,
  MessageEmits,
  MessageEntry,
  MessageGroup,
  MessageHandle,
  MessageProps,
  MessageQueue,
  MessageQueueSnapshot,
  MessageSlots,
  MessageType,
} from "@shuimo-design/core";
