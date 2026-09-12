/** 确认框的类型定义。原来在 vue 包里，整份是纯 TS，搬到 core 后两个壳共用同一份 */
import type { ModalMask } from "../../overlay/modal";

/** 遮罩配置。和弹窗、抽屉共用同一套语义，所以直接用 overlay 那份 */
export type ConfirmMask = ModalMask;

export interface ConfirmProps {
  /** 正文；也可以用默认插槽 */
  content?: string;
  /** 标题，不传就不渲染 */
  title?: string;
  /** 遮罩配置，默认 { show: true, clickClose: true }；传布尔只控制显示 */
  mask?: boolean | ConfirmMask;
  /** 传送目标：true 到 body、false 原地渲染、字符串为选择器；默认 true */
  teleport?: boolean | string;
  /** 确定按钮文字，默认「确定」 */
  confirmText?: string;
  /** 取消按钮文字，默认「取消」 */
  cancelText?: string;
  /** 按 Esc 是否等同取消，默认 true */
  closeOnEsc?: boolean;
  /** 笔触种子，默认 1 */
  seed?: number;
}

export interface ConfirmEmits {
  /** 点了确定 */
  confirm: [];
  /** 点了取消、遮罩或按了 Esc */
  cancel: [];
  /** 离场动画结束 */
  closed: [];
}

export interface ConfirmSlots {
  /** 替代 content */
  default?: () => unknown;
  /** 替代底部按钮，参数里给了确定 / 取消两个方法 */
  footer?: (props: { confirm: () => void; cancel: () => void }) => unknown;
}

/** 函数式调用的配置：传字符串就是 content */
export type ConfirmConfig = string | Omit<ConfirmProps, "teleport">;

export interface ConfirmApi {
  /** 弹出确认框：确定 resolve true，取消 / 点遮罩 / Esc resolve false */
  show(config: ConfirmConfig): Promise<boolean>;
  /** 再建一套独立的队列（要另外给它配一个出口） */
  create(): ConfirmApi;
}
