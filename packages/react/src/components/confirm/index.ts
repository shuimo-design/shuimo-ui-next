import { confirm, confirmApi } from "@shuimo-design/core";
import { MConfirm as MConfirmComponent } from "./MConfirm";

/** 组件本体，同时挂着函数式调用：const ok = await MConfirm.show("...") */
export const MConfirm = Object.assign(MConfirmComponent, confirmApi(confirm));
export type { MConfirmProps } from "./MConfirm";
export { confirm, confirmApi, createConfirmQueue } from "@shuimo-design/core";
export type {
  ConfirmApi,
  ConfirmConfig,
  ConfirmMask,
  ConfirmQueue,
  ConfirmQueueSnapshot,
  ConfirmRequest,
} from "@shuimo-design/core";
