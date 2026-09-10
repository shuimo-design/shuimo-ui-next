import type { Placement } from "@floating-ui/vue";
import type { PopoverTrigger } from "../../internal/popover-trigger";

export type PopoverPlacement = Placement;
export type { PopoverTrigger };

export interface PopoverProps {
  /** 气泡出现的方位（floating-ui placement），默认 bottom */
  placement?: PopoverPlacement;
  /** 触发方式：hover / click / focus / manual（只听 v-model:show），默认 click */
  trigger?: PopoverTrigger;
  /** 内容只是一段文字时可以直接传，等价于 #content */
  content?: string;
  /** 禁用：不再响应触发，已打开的会收起 */
  disabled?: boolean;
  /** 显示指向参照元素的墨尖箭头，默认 true */
  arrow?: boolean;
  /** 气泡与参照元素的间距 px，默认 8 */
  offset?: number;
  /** hover 触发的打开延时 ms，默认 0 */
  openDelay?: number;
  /** hover 触发的收起延时 ms，默认 100；鼠标从参照移到气泡上时靠它不闪断 */
  closeDelay?: number;
  /** click 触发时点到气泡外不自动收起 */
  disableClickAway?: boolean;
  /** 气泡传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
  /** 笔触边框与墨尖的种子，默认 1 */
  seed?: number;
}

export interface PopoverEmits {
  /** 显隐变化（用户操作引起的；改 v-model:show 不会触发） */
  visibleChange: [open: boolean];
}

export interface PopoverSlots {
  /** 触发内容；第一个元素当参照元素 */
  default?: () => unknown;
  /** 气泡内容 */
  content?: () => unknown;
}
