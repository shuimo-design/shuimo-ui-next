/** 日期小工具：只支持 YYYY / MM / DD 三种 token，够日期选择器用，不引 dayjs */

export type FirstDayOfWeek = 0 | 1;

/** 周名，从周日起 */
export const WEEKDAY_NAMES = ["日", "壹", "贰", "叁", "肆", "伍", "陆"] as const;

/** 按一周的起始日轮转后的周名 */
export function weekdayNames(firstDayOfWeek: FirstDayOfWeek): string[] {
  return [...WEEKDAY_NAMES.slice(firstDayOfWeek), ...WEEKDAY_NAMES.slice(0, firstDayOfWeek)];
}

const TOKEN = /YYYY|MM|DD/g;

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

export function formatDate(date: Date, format: string): string {
  return format.replace(TOKEN, (token) => {
    if (token === "YYYY") return pad(date.getFullYear(), 4);
    if (token === "MM") return pad(date.getMonth() + 1, 2);
    return pad(date.getDate(), 2);
  });
}

/** 按 format 解析；缺 MM / DD 时补 1；对不上或日期不存在（如 2 月 30 日）返回 null */
export function parseDate(text: string, format: string): Date | null {
  const order: string[] = [];
  const source = format.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(TOKEN, (token) => {
    order.push(token);
    return token === "YYYY" ? "(\\d{4})" : "(\\d{1,2})";
  });
  const match = new RegExp(`^${source}$`).exec(text.trim());
  if (!match) return null;
  let year: number | undefined;
  let month = 1;
  let day = 1;
  order.forEach((token, index) => {
    const value = Number(match[index + 1]);
    if (token === "YYYY") year = value;
    else if (token === "MM") month = value;
    else day = value;
  });
  if (year === undefined) return null;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) return null;
  return new Date(year, month - 1, day);
}

/** v-model 进来的值转成 Date：Date 对象直接取当天零点，字符串按 format 解析；空值或解析失败返回 null */
export function toDate(value: string | Date | null | undefined, format: string): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : startOfDay(value);
  return parseDate(value, format);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

/** 加减月份，日子超出目标月时压到月末（1 月 31 日 + 1 月 = 2 月 28/29 日） */
export function addMonths(date: Date, amount: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + amount;
  const day = Math.min(date.getDate(), daysInMonth(year, month));
  return new Date(year, month, day);
}

/** 年面板每页 12 年，按 12 对齐 */
export function yearPageStart(year: number): number {
  return Math.floor(year / 12) * 12;
}

export interface CalendarCell {
  date: Date;
  /** 属于当前月（否则是前后补的） */
  inMonth: boolean;
  disabled: boolean;
  today: boolean;
  selected: boolean;
}

export interface CalendarOptions {
  firstDayOfWeek?: FirstDayOfWeek;
  selected?: Date | null;
  today?: Date;
  isDisabled?: (date: Date) => boolean;
}

/** 生成某月的月历：固定 6 行 × 7 列 42 格，前后用相邻月补齐 */
export function buildCalendar(
  year: number,
  month: number,
  options: CalendarOptions = {},
): CalendarCell[] {
  const { firstDayOfWeek = 0, selected = null, today = new Date(), isDisabled } = options;
  const lead = (new Date(year, month, 1).getDay() - firstDayOfWeek + 7) % 7;
  const cells: CalendarCell[] = [];
  for (let index = 0; index < 42; index++) {
    const date = new Date(year, month, 1 - lead + index);
    cells.push({
      date,
      inMonth: date.getFullYear() === year && date.getMonth() === month,
      disabled: isDisabled?.(date) ?? false,
      today: sameDay(date, today),
      selected: selected ? sameDay(date, selected) : false,
    });
  }
  return cells;
}
