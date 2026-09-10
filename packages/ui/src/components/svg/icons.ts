import type { Component } from "vue";
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
import type { InkMarkKind } from "../../ink/assets/mark";
import type { SvgIconName } from "./types";

/** 图标名 → 线性图标 SFC */
export const SVG_ICONS: Record<SvgIconName, Component> = {
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

/** 有笔触版的图标名 → 素材库里的记号种类；没列的只有线性版 */
export const SVG_INK_MARKS: Partial<Record<SvgIconName, InkMarkKind>> = {
  check: "check",
  close: "cross",
  "chevron-down": "chevronDown",
  "chevron-right": "chevronRight",
  dot: "dot",
  minus: "minus",
  plus: "plus",
};
