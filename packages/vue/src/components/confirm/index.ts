import { confirm, confirmApi } from "@shuimo-design/core";
import MConfirmSfc from "./MConfirm.vue";

/**
 * 组件本体，同时挂着函数式调用：const ok = await MConfirm.show("...")。
 *
 * **`useConfirm()` 已经删掉**，理由同 MMessage：确认框现在由 `<MOverlayOutlet>`
 * （`<MConfigProvider>` 自带）渲染在用户自己的树里，不用再借应用上下文。
 */
export const MConfirm = Object.assign(MConfirmSfc, confirmApi(confirm));
export { confirm, confirmApi, createConfirmQueue } from "@shuimo-design/core";
export type {
  ConfirmApi,
  ConfirmConfig,
  ConfirmEmits,
  ConfirmMask,
  ConfirmProps,
  ConfirmQueue,
  ConfirmQueueSnapshot,
  ConfirmRequest,
  ConfirmSlots,
} from "@shuimo-design/core";
