import type { ModalMask } from "../../internal/modal";

export type { ModalMask };

export interface DialogProps {
  /** 遮罩：false 不显示底色；对象可分别控制 show（显示）与 clickClose（点外面关闭），默认都开 */
  mask?: boolean | ModalMask;
  /** 显示右上角的挂牌关闭按钮，默认 true */
  closeBtn?: boolean;
  /** 按 ESC 关闭，默认 true */
  closeOnEsc?: boolean;
  /** 标题；也可用 header 插槽 */
  title?: string;
  /** 宽度，数字按 px；默认 min(560px, 100vw - 32px)，也可覆盖 CSS 变量 --m-dialog-w */
  width?: number | string;
  /** 高度，数字按 px；默认随内容，也可覆盖 CSS 变量 --m-dialog-h */
  height?: number | string;
  /** 传送目标：true 到 body，字符串为选择器，false 原地渲染（测试或受限容器用），默认 true */
  teleport?: boolean | string;
  /** 笔触与角饰的随机种子，默认 1 */
  seed?: number;
}

export interface DialogEmits {
  /** 变为显示 */
  open: [];
  /** 变为隐藏（关闭按钮、ESC、点遮罩或外部改 v-model 都会触发） */
  close: [];
}

export interface DialogSlots {
  /** 弹窗内容 */
  default?: () => unknown;
  /** 触发元素：点一下就打开，省去自己维护 v-model */
  active?: () => unknown;
  /** 头部，替代 title */
  header?: () => unknown;
  /** 底部操作区 */
  footer?: () => unknown;
}
