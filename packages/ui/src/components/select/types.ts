/** 可写回 v-model 的值：原始值，或整个选项对象（对象要配 toMatch 才能判断选中） */
export type SelectValue = string | number | boolean | object;

export interface SelectOption {
  /** 显示文字 */
  label: string;
  /** 写回 v-model 的值 */
  value: SelectValue;
  /** 不可选 */
  disabled?: boolean;
}

/**
 * 候选项的三种写法：
 * 1. `{ label, value, disabled? }` 对象；
 * 2. 原始值（字符串 / 数字 / 布尔），显示和写回都用它本身；
 * 3. 任意对象，配 optionParam / valueParam / inputParam 指定各自取哪个字段。
 */
export type SelectOptionLike = SelectOption | string | number | boolean | object;

export interface SelectProps {
  /** 候选项 */
  options: SelectOptionLike[];
  /** 选项是对象时，下拉里显示哪个字段；不传就用 label */
  optionParam?: string;
  /** 选项是对象时，写回 v-model 的是哪个字段；不传就用 value（没有 value 字段就写回整个对象） */
  valueParam?: string;
  /** 选项是对象时，选中后触发区里显示哪个字段；不传就跟 optionParam */
  inputParam?: string;
  /** 自定义"某个选项是否等于当前值"，v-model 是对象时用；参数是原始选项和 v-model 的值 */
  toMatch?: (option: SelectOptionLike, value: SelectValue) => boolean;
  /** 占位文字，默认「请选择」 */
  placeholder?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 有值时显示清空按钮 */
  clearable?: boolean;
  /** 多选；v-model 为数组 */
  multiple?: boolean;
  /** 可输入过滤；默认按显示文字包含匹配，大小写不敏感 */
  filterable?: boolean;
  /** 自定义过滤函数，参数是原始选项和输入的文字 */
  filter?: (option: SelectOptionLike, query: string) => boolean;
  /** 下拉显示加载中（替换整个列表） */
  loading?: boolean;
  /** 滚到底部时调用，用来分页追加候选项；调用期间列表底部显示加载中 */
  fetch?: () => Promise<void>;
  /** 无候选项时的文字，默认「暂无数据」 */
  emptyText?: string;
  /** 下拉最大高度 px，默认 240 */
  maxHeight?: number;
  /** 下拉传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
}

export interface SelectEmits {
  /** 选中值变化 */
  change: [value: SelectValue | SelectValue[] | undefined];
  /** 点选了某个选项，参数是原始选项（多选时取消勾选也会触发） */
  select: [option: SelectOptionLike];
  /** 过滤框里的文字变化 */
  input: [value: string];
  /** 下拉开合 */
  visibleChange: [open: boolean];
  /** 多选时点了 Tag 的关闭 */
  removeTag: [value: SelectValue];
  /** 点了清空按钮 */
  clear: [];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}

export interface SelectSlots {
  /** 自定义选项内容；option 是原始选项，label 是按 optionParam 取出的显示文字 */
  option?: (scope: { option: SelectOptionLike; label: string; selected: boolean }) => unknown;
  /** 无数据时的内容 */
  empty?: () => unknown;
  /** 触发区前的内容（图标） */
  prefix?: () => unknown;
}
