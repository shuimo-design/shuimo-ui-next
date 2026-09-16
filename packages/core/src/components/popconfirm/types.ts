import type { Placement } from "@floating-ui/dom";
import type { ButtonType } from "../button/types";

export type PopconfirmPlacement = Placement;

export interface PopconfirmProps {
  /** 标题，也是读屏念出来的对话框名字；可用 title 插槽替代内容，但属性仍要传 */
  title: string;
  /** 说明文字；也可以用 content 插槽 */
  content?: string;
  /** 确定按钮文字，默认「确定」 */
  confirmText?: string;
  /** 取消按钮文字，默认「取消」 */
  cancelText?: string;
  /** 确定按钮的类型，默认 primary */
  confirmType?: ButtonType;
  /** 气泡出现的方位（floating-ui placement），默认 top */
  placement?: PopconfirmPlacement;
  /** 禁用：点触发元素不再弹出，已打开的会收起 */
  disabled?: boolean;
  /** 标题左侧的提示徽记，默认 true */
  icon?: boolean;
  /** 气泡与触发元素的间距 px，默认 8 */
  offset?: number;
  /** 气泡传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
  /** 笔触边框、墨尖与徽记的种子，默认 1 */
  seed?: number;
}

export interface PopconfirmEmits {
  /** 点了确定 */
  confirm: [];
  /** 点了取消、点到气泡外面或按了 Esc */
  cancel: [];
}

export interface PopconfirmSlots {
  /** 触发内容；第一个元素当参照元素 */
  default?: () => unknown;
  /** 替代 title 属性的显示内容 */
  title?: () => unknown;
  /** 替代 content 属性 */
  content?: () => unknown;
}
