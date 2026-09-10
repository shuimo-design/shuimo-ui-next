export interface ConfirmMask {
  /** 显示半透明遮罩，默认 true */
  show?: boolean;
  /** 点遮罩等同取消，默认 true */
  clickClose?: boolean;
}

export interface ConfirmProps {
  /** 正文；也可以用默认插槽 */
  content?: string;
  /** 标题，不传就不渲染 */
  title?: string;
  /** 遮罩配置，默认 { show: true, clickClose: true } */
  mask?: ConfirmMask;
  /** 传送目标：true 到 body、false 原地渲染、字符串为选择器；默认 true */
  teleport?: boolean | string;
  /** 确定按钮文字，默认「确定」 */
  confirmText?: string;
  /** 取消按钮文字，默认「取消」 */
  cancelText?: string;
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
}
