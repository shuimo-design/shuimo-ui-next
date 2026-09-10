import type { ModalMask } from "../../internal/modal";

export type DrawerDirection = "top" | "right" | "bottom" | "left";

export interface DrawerProps {
  /** 遮罩：false 不显示底色；对象可分别控制 show（显示）与 clickClose（点外面关闭），默认都开 */
  mask?: boolean | ModalMask;
  /** 从哪条边滑出，默认 right */
  direction?: DrawerDirection;
  /** 左右抽屉是宽度、上下抽屉是高度，数字按 px；默认 320px，也可覆盖 CSS 变量 --m-drawer-size */
  size?: number | string;
  /** 显示关闭按钮，默认 true */
  closeBtn?: boolean;
  /** 按 ESC 关闭，默认 true */
  closeOnEsc?: boolean;
  /** 标题；也可用 header 插槽 */
  title?: string;
  /** 传送目标：true 到 body，字符串为选择器，false 原地渲染，默认 true */
  teleport?: boolean | string;
  /** 边缘笔触线的随机种子，默认 1 */
  seed?: number;
}

export interface DrawerEmits {
  /** 变为显示 */
  open: [];
  /** 变为隐藏（关闭按钮、ESC、点遮罩或外部改 v-model 都会触发） */
  close: [];
}

export interface DrawerSlots {
  /** 抽屉内容 */
  default?: () => unknown;
  /** 触发元素：点一下就打开 */
  active?: () => unknown;
  /** 头部，替代 title */
  header?: () => unknown;
  /** 底部操作区 */
  footer?: () => unknown;
}
