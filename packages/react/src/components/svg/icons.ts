import type { ComponentType } from "react";
import type { SvgIconName } from "@shuimo-design/core";
import {
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconClose,
  IconDot,
  IconEye,
  IconEyeOff,
  IconLoading,
  IconMinus,
  IconPlus,
  IconSearch,
} from "../../icons";

/**
 * 图标名 → 线性图标组件。
 * 这张表的值是 React 组件，下沉不到 core；Vue 包那边有一张一模一样的表。
 * 「哪些名字有笔触版」是纯数据，在 core 的 SVG_INK_MARKS 里只有一份。
 */
export const SVG_ICONS: Record<SvgIconName, ComponentType> = {
  calendar: IconCalendar,
  check: IconCheck,
  "chevron-down": IconChevronDown,
  "chevron-left": IconChevronLeft,
  "chevron-right": IconChevronRight,
  "chevrons-left": IconChevronsLeft,
  "chevrons-right": IconChevronsRight,
  close: IconClose,
  dot: IconDot,
  eye: IconEye,
  "eye-off": IconEyeOff,
  loading: IconLoading,
  minus: IconMinus,
  plus: IconPlus,
  search: IconSearch,
};
