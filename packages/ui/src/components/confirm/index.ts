import MConfirmSfc from "./MConfirm.vue";
import { confirm } from "./api";

/** 组件本体，同时挂着函数式调用：const ok = await MConfirm.show("...") */
export const MConfirm = Object.assign(MConfirmSfc, confirm);
export { createConfirm, useConfirm } from "./api";
export type * from "./types";
