import type { Placement } from "@floating-ui/vue";
import type { PopoverTrigger } from "../../internal/popover-trigger";

export type TooltipPlacement = Placement;
export type TooltipTrigger = PopoverTrigger;

export interface TooltipProps {
  /** 提示出现的方位（floating-ui placement），默认 bottom */
  placement?: TooltipPlacement;
  /** 触发方式：hover（同时响应键盘聚焦）/ click / focus / manual，默认 hover */
  trigger?: TooltipTrigger;
  /** 提示文字，等价于 #content */
  content?: string;
  /** 禁用：不再弹出，已打开的会收起 */
  disabled?: boolean;
  /** 显示指向参照元素的墨尖箭头，默认 true */
  arrow?: boolean;
  /** 提示与参照元素的间距 px，默认 6 */
  offset?: number;
  /** hover 触发的打开延时 ms，默认 80 */
  openDelay?: number;
  /** hover 触发的收起延时 ms，默认 80 */
  closeDelay?: number;
  /** click 触发时点到提示外不自动收起 */
  disableClickAway?: boolean;
  /** 提示传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
  /** 笔触边框与墨尖的种子，默认 1 */
  seed?: number;
}

export interface TooltipEmits {
  /** 显隐变化（用户操作引起的；改 v-model:show 不会触发） */
  visibleChange: [open: boolean];
}

export interface TooltipSlots {
  /** 被提示的内容；第一个元素当参照元素，并挂上 aria-describedby */
  default?: () => unknown;
  /** 提示内容 */
  content?: () => unknown;
}
