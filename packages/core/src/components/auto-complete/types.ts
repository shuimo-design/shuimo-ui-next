import type { Placement } from "@floating-ui/dom";

export type AutoCompletePlacement = Placement;

export interface AutoCompleteOption {
  /** 选中后写进输入框的文字 */
  value: string;
  /** 下拉里显示的文字，不传就显示 value */
  label?: string;
  /** 不可选 */
  disabled?: boolean;
}

/** 自定义过滤：参数是输入的文字和一个候选项 */
export type AutoCompleteFilter = (input: string, option: AutoCompleteOption) => boolean;

export interface AutoCompleteProps {
  /** 候选项 */
  options: readonly AutoCompleteOption[];
  /**
   * 过滤方式。true（默认）按前缀匹配、大小写不敏感；传函数自定义；
   * false 不过滤，调用方按 search 事件自己筛好再传 options
   */
  filter?: boolean | AutoCompleteFilter;
  /** 占位文字 */
  placeholder?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 有内容时显示清空按钮 */
  clearable?: boolean;
  /** search 事件的防抖毫秒数，默认 0（每次输入都发） */
  debounce?: number;
  /** 下拉出现的方位（floating-ui placement），默认 bottom-start */
  placement?: AutoCompletePlacement;
  /** 下拉传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
  /** 没有匹配项时显示的文字；空串（默认）就不弹下拉 */
  emptyText?: string;
  /** 下拉边框笔触的种子，默认 3 */
  seed?: number;
}

export interface AutoCompleteEmits {
  /** 输入的文字（防抖之后） */
  search: [input: string];
  /** 选中了某一项 */
  select: [option: AutoCompleteOption];
  /** 获得焦点 */
  focus: [event: FocusEvent];
  /** 失去焦点 */
  blur: [event: FocusEvent];
  /** 点了清空按钮 */
  clear: [];
}

/**
 * 选项插槽的作用域参数。Vue 是 `#option="{ option, active }"`，
 * React 是 render prop `renderOption={(scope) => ...}`，两边共用这一份类型。
 */
export interface AutoCompleteOptionScope {
  option: AutoCompleteOption;
  /** 这一项是否被键盘 / 鼠标高亮 */
  active: boolean;
}

export interface AutoCompleteSlots {
  /** 自定义每一项的内容 */
  option?: (scope: AutoCompleteOptionScope) => unknown;
  /** 输入框前的内容（图标） */
  prefix?: () => unknown;
  /** 输入框后的内容 */
  suffix?: () => unknown;
}

export interface AutoCompleteExpose {
  focus: () => void;
  blur: () => void;
}
