import MMessageSfc from "./MMessage.vue";
import { message } from "./api";

/** 组件本体，同时挂着函数式调用：MMessage.success("...")、MMessage.show({ ... }) */
export const MMessage = Object.assign(MMessageSfc, message);
export { createMessage, useMessage } from "./api";
export type * from "./types";
