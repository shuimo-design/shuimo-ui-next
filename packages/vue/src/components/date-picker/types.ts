export type DatePickerType = "date" | "month" | "year";

export interface DatePickerProps {
  /** 选日 / 选月 / 选年，默认 date */
  type?: DatePickerType;
  /** 输出格式，只认 YYYY / MM / DD；缺省按 type：YYYY-MM-DD / YYYY-MM / YYYY */
  format?: string;
  /** 占位文字，默认「请选择日期」 */
  placeholder?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 有值时显示清空按钮，默认 true */
  clearable?: boolean;
  /** 返回 true 的日期不可选 */
  disabledDate?: (date: Date) => boolean;
  /** 一周从周日（0）还是周一（1）开始，默认 0 */
  firstDayOfWeek?: 0 | 1;
  /** 面板传送到 body；默认 true。关掉时渲染在原地（用于测试或受限容器） */
  teleport?: boolean;
}

export interface DatePickerEmits {
  /** 值变化，参数是格式化后的字符串，清空为 null */
  change: [value: string | null];
  /** 面板开合 */
  visibleChange: [open: boolean];
  /** 点了清空按钮 */
  clear: [];
}
