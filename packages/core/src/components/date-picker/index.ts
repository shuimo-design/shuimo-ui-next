/**
 * 日期选择器的无框架部分。
 *
 * 真正碰 DOM 的只有两件事：把焦点送到当前那一格上、收起面板后把焦点还给触发按钮。
 * 其余全是日期运算——月历怎么排（固定 6×7、前后用相邻月补齐）、哪一格是今天 / 选中 / 禁用、
 * 格式化与解析、方向键 / PageUp / PageDown / Home / End 各自挪到哪一天、
 * 哪一格该拿 tabindex=0——一行都不该在壳里重写。
 *
 * 分两类：
 * - 纯派生（月历、月格年格、文案、class）是纯函数，由壳在渲染期调；
 * - 有状态的（展开、当前看的是日 / 月 / 年、正在看哪个月、键盘焦点落在哪天、今天是哪天）写成控制器。
 */
import { brushLineUrl } from "../../ink/assets/line";
import { inkEnsoUrl } from "../../ink/assets/enso";
import { inkMarkUrl } from "../../ink/assets/mark";
import { FIELD_STROKE } from "../field-stroke";
import { createStore } from "../../runtime/store";
import type { BrushBorderOptions } from "../../ink/stroke";
import type { Controller } from "../../runtime/controller";
import type { DatePickerType } from "./types";
import {
  addDays,
  addMonths,
  buildCalendar,
  daysInMonth,
  formatDate,
  sameDay,
  startOfDay,
  toDate,
  weekdayNames,
  yearPageStart,
  type FirstDayOfWeek,
} from "./date";

export type { DatePickerEmits, DatePickerProps, DatePickerType } from "./types";
export {
  addDays,
  addMonths,
  buildCalendar,
  daysInMonth,
  formatDate,
  parseDate,
  sameDay,
  sameMonth,
  startOfDay,
  toDate,
  weekdayNames,
  yearPageStart,
  WEEKDAY_NAMES,
  type CalendarCell,
  type CalendarOptions,
  type FirstDayOfWeek,
} from "./date";

/* ── 文案、默认值与笔触参数 ───────────────────────────────────── */

/** 缺省输出格式，按 type 分 */
export const DATE_PICKER_FORMATS: Record<DatePickerType, string> = {
  date: "YYYY-MM-DD",
  month: "YYYY-MM",
  year: "YYYY",
};

export const DATE_PICKER_PLACEHOLDER = "请选择日期";
export const DATE_PICKER_CLEAR_LABEL = "清空";
/** 月名，索引就是月份 */
export const MONTH_NAMES = [
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
  "十一",
  "十二",
] as const;

/** 触发器和输入框共用一套细笔触参数，同一张表单里边框粗细才一致 */
export const DATE_PICKER_TRIGGER_BRUSH: BrushBorderOptions = FIELD_STROKE;
/** 面板被传送到 body，边框要套在面板容器自己身上 */
export const DATE_PICKER_PANEL_BRUSH: BrushBorderOptions = { strokeWidth: 2, seed: 3 };

/** 面板宽度里能放 7 格的那条分割线长度，和 CSS 里的格宽 32px × 7 对应 */
const DIVIDER_LENGTH = 224;

// 面板里的水墨素材：选中日期的禅圈、翻页箭头、周名下的分割线。整个模块只生成一次
const DIVIDER = brushLineUrl({ seed: 4, length: DIVIDER_LENGTH, thickness: 2 });
const PANEL_INK: Record<string, string> = {
  "--m-date-picker-ring": `url("${inkEnsoUrl({ seed: 7, size: 32, strokeWidth: 3.2 })}")`,
  "--m-date-picker-mark-prev-year": `url("${inkMarkUrl("chevronsLeft", { seed: 2 })}")`,
  "--m-date-picker-mark-prev-month": `url("${inkMarkUrl("chevronLeft", { seed: 2 })}")`,
  "--m-date-picker-mark-next-month": `url("${inkMarkUrl("chevronRight", { seed: 2 })}")`,
  "--m-date-picker-mark-next-year": `url("${inkMarkUrl("chevronsRight", { seed: 2 })}")`,
  "--m-date-picker-divider": `url("${DIVIDER.url}")`,
  "--m-date-picker-divider-band": `${DIVIDER.height}px`,
};

/** 面板在 body 下拿不到组件根上的变量，所以这些直接写成面板容器的行内变量 */
export function datePickerPanelInkStyle(): Record<string, string> {
  return PANEL_INK;
}

/* ── class / 文案的纯派生 ─────────────────────────────────────── */

export function datePickerClasses(state: { open: boolean; disabled: boolean }): string[] {
  return [
    "m-date-picker",
    ...(state.open ? ["m-date-picker--open"] : []),
    ...(state.disabled ? ["m-date-picker--disabled"] : []),
  ];
}

/** 格子的 class；unit 决定加不加 --month / --year 那一档 */
export function datePickerCellClasses(state: {
  unit: DatePickerType;
  outside?: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-date-picker__cell",
    ...(state.unit === "date" ? [] : [`m-date-picker__cell--${state.unit}`]),
    ...(state.outside ? ["m-date-picker__cell--outside"] : []),
    ...(state.today ? ["m-date-picker__cell--today"] : []),
    ...(state.selected ? ["m-date-picker__cell--selected"] : []),
    ...(state.disabled ? ["m-date-picker__cell--disabled"] : []),
  ];
}

/** 翻「一大页」的按钮：日 / 月面板是按年翻，年面板是按 12 年翻，名字也跟着换 */
export function datePickerPageLabel(view: DatePickerType, direction: -1 | 1): string {
  if (view === "year") return direction < 0 ? "上一页" : "下一页";
  return direction < 0 ? "上一年" : "下一年";
}

/** 翻一大页对应多少个月：年面板 12 年 = 144 个月 */
export function datePickerPageStep(view: DatePickerType, direction: -1 | 1): number {
  return direction * (view === "year" ? 144 : 12);
}

export const DATE_PICKER_PREV_MONTH_LABEL = "上一月";
export const DATE_PICKER_NEXT_MONTH_LABEL = "下一月";

/** 缺省按 type 取格式 */
export function datePickerFormat(type: DatePickerType, format?: string): string {
  return format ?? DATE_PICKER_FORMATS[type];
}

/** 格子上的 data-key：同一天在日 / 月 / 年面板里各有一个不撞的名字 */
export function datePickerKey(date: Date, unit: DatePickerType): string {
  return formatDate(date, DATE_PICKER_FORMATS[unit]);
}

/* ── 面板数据 ─────────────────────────────────────────────────── */

export interface DatePickerCell {
  date: Date;
  /** data-key 与 v-for 的 key */
  key: string;
  /** 格子里显示的文字 */
  text: string;
  /** 读屏念的完整日期 */
  label: string;
  /** 日面板专用：不属于当前月，是前后补的 */
  outside: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
}

export interface DatePickerViewOptions {
  /** 组件要选的粒度 */
  type: DatePickerType;
  /** 面板当前显示的粒度 */
  view: DatePickerType;
  format: string;
  /** 当前 v-model / value */
  value: string | Date | null | undefined;
  /** 面板正在看的月份 */
  viewDate: Date;
  /** 键盘焦点所在的日期 */
  focusDate: Date;
  today: Date;
  firstDayOfWeek: FirstDayOfWeek;
  disabledDate?: (date: Date) => boolean;
}

export interface DatePickerViewData {
  selected: Date | null;
  /** 触发区显示的文字 */
  displayText: string;
  viewYear: number;
  viewMonth: number;
  /** 年面板这一页的头一年 */
  yearStart: number;
  weekdays: string[];
  /** 日面板：6 行 × 7 格 */
  rows: DatePickerCell[][];
  /** 月面板：3 行 × 4 格 */
  monthRows: DatePickerCell[][];
  /** 年面板：3 行 × 4 格 */
  yearRows: DatePickerCell[][];
  /** 当前面板里该拿 tabindex=0 的那一格 */
  tabStopKey: string;
}

function chunk(cells: DatePickerCell[], size: number): DatePickerCell[][] {
  const rows: DatePickerCell[][] = [];
  for (let index = 0; index < cells.length; index += size) {
    rows.push(cells.slice(index, index + size));
  }
  return rows;
}

function dayCells(o: DatePickerViewOptions, selected: Date | null): DatePickerCell[] {
  return buildCalendar(o.viewDate.getFullYear(), o.viewDate.getMonth(), {
    firstDayOfWeek: o.firstDayOfWeek,
    selected,
    today: o.today,
    isDisabled: o.disabledDate,
  }).map((cell) => ({
    date: cell.date,
    key: datePickerKey(cell.date, "date"),
    text: String(cell.date.getDate()),
    label: `${cell.date.getFullYear()}年${cell.date.getMonth() + 1}月${cell.date.getDate()}日`,
    outside: !cell.inMonth,
    today: cell.today,
    selected: cell.selected,
    disabled: cell.disabled,
  }));
}

function monthCells(o: DatePickerViewOptions, selected: Date | null): DatePickerCell[] {
  const year = o.viewDate.getFullYear();
  return MONTH_NAMES.map((name, month) => {
    const date = new Date(year, month, 1);
    return {
      date,
      key: datePickerKey(date, "month"),
      text: `${name}月`,
      label: `${year}年${name}月`,
      outside: false,
      today: o.today.getFullYear() === year && o.today.getMonth() === month,
      selected: !!selected && selected.getFullYear() === year && selected.getMonth() === month,
      // 只有选月的时候 disabledDate 才作用在月格上；选日时月格只是跳转用的
      disabled: o.type === "month" && (o.disabledDate?.(date) ?? false),
    };
  });
}

function yearCells(o: DatePickerViewOptions, selected: Date | null): DatePickerCell[] {
  const start = yearPageStart(o.viewDate.getFullYear());
  return Array.from({ length: 12 }, (_, offset) => {
    const year = start + offset;
    const date = new Date(year, 0, 1);
    return {
      date,
      key: datePickerKey(date, "year"),
      text: String(year),
      label: `${year}年`,
      outside: false,
      today: o.today.getFullYear() === year,
      selected: selected?.getFullYear() === year,
      disabled: o.type === "year" && (o.disabledDate?.(date) ?? false),
    };
  });
}

/**
 * 当前面板里该拿 tabindex=0 的那一格：焦点日在这一页里就是它，否则退到本页第一格。
 * 一个网格里只留一个 tab 停靠点（roving tabindex），Tab 才不会在 42 个格子里一个个走。
 */
function tabStopKey(o: DatePickerViewOptions, cells: DatePickerCell[]): string {
  const focus = o.focusDate;
  if (o.view === "date") {
    const inView = cells.some((cell) => sameDay(cell.date, focus));
    const first = cells.find((cell) => !cell.outside)?.date ?? o.viewDate;
    return datePickerKey(inView ? focus : first, "date");
  }
  if (o.view === "month") {
    const inView = focus.getFullYear() === o.viewDate.getFullYear();
    return datePickerKey(inView ? focus : o.viewDate, "month");
  }
  const start = yearPageStart(o.viewDate.getFullYear());
  const inView = yearPageStart(focus.getFullYear()) === start;
  return datePickerKey(inView ? focus : new Date(start, 0, 1), "year");
}

/** 渲染面板要用的全部派生数据，一次算完。壳在渲染期调它（computed / 渲染体内直接调） */
export function datePickerView(o: DatePickerViewOptions): DatePickerViewData {
  const selected = toDate(o.value, o.format);
  const days = dayCells(o, selected);
  const months = monthCells(o, selected);
  const years = yearCells(o, selected);
  const cells = o.view === "date" ? days : o.view === "month" ? months : years;
  return {
    selected,
    // 能解析就按 format 重排，解析不了的字符串原样给回去
    displayText: selected
      ? formatDate(selected, o.format)
      : typeof o.value === "string"
        ? o.value
        : "",
    viewYear: o.viewDate.getFullYear(),
    viewMonth: o.viewDate.getMonth(),
    yearStart: yearPageStart(o.viewDate.getFullYear()),
    weekdays: weekdayNames(o.firstDayOfWeek),
    rows: chunk(days, 7),
    monthRows: chunk(months, 4),
    yearRows: chunk(years, 4),
    tabStopKey: tabStopKey(o, cells),
  };
}

export function datePickerShowClear(o: {
  clearable: boolean;
  disabled: boolean;
  displayText: string;
}): boolean {
  return o.clearable && !o.disabled && !!o.displayText;
}

/* ── 控制器 ───────────────────────────────────────────────────── */

export interface DatePickerSnapshot {
  readonly open: boolean;
  /** 当前显示的是日 / 月 / 年面板 */
  readonly view: DatePickerType;
  /** 面板正在看的月份（取当月 1 日） */
  readonly viewDate: Date;
  /** 键盘焦点所在的日期（roving tabindex） */
  readonly focusDate: Date;
  readonly today: Date;
}

export interface DatePickerOptions {
  type: DatePickerType;
  format: string;
  value: string | Date | null | undefined;
  firstDayOfWeek: FirstDayOfWeek;
  disabled: boolean;
  disabledDate?: (date: Date) => boolean;
  /** 请求写回新值（壳负责写 v-model / setState，并发 change） */
  onCommit: (next: string | null) => void;
  /** 面板开合 */
  onVisibleChange: (open: boolean) => void;
  /** 点了清空按钮 */
  onClear: () => void;
}

export interface DatePickerController extends Controller<DatePickerSnapshot, DatePickerOptions> {
  /** 触发按钮：收起面板后焦点要还给它 */
  setTrigger(el: HTMLElement | null): void;
  /** 面板容器：焦点要落到它里面的某一格上 */
  setPanel(el: HTMLElement | null): void;
  /**
   * 把焦点落到当前那一格上。控制器只记「该挪焦点了」，真正 focus() 要等 DOM 画完，
   * 所以由壳在 DOM 更新后调这个（Vue 的 flush: "post" / React 的 useEffect）。
   * 没待办、或者面板还没出现时都是空操作，待办会留到下一次——
   * React 的过渡组件要多一轮渲染才把面板挂上去，早调一次不能把待办吃掉。
   */
  flushFocus(): void;
  toggle(): void;
  /** 收起；refocus 为真时把焦点还给触发按钮 */
  close(refocus: boolean): void;
  /** 头部箭头：按月 / 年 / 12 年翻页 */
  shiftView(months: number): void;
  /** 头部的年 / 月按钮：切换面板粒度 */
  setView(view: DatePickerType): void;
  pick(date: Date): void;
  pickMonth(date: Date): void;
  pickYear(date: Date): void;
  clear(): void;
  /** 日格拿到焦点 */
  focusDay(date: Date): void;
  /** 月格拿到焦点：把焦点日挪到那个月（日子尽量保留） */
  focusMonth(date: Date): void;
  /** 年格拿到焦点 */
  focusYear(date: Date): void;
  onPanelKeydown(event: KeyboardEvent): void;
  onTriggerKeydown(event: KeyboardEvent): void;
  onClickOutside(): void;
}

export function createDatePicker(initial: DatePickerOptions): DatePickerController {
  // 今天是哪天只有运行时才知道；服务端和客户端跨午夜时本来就会不一致，
  // 所以这一份在建控制器时取一次，之后每次打开面板再校准
  const now = startOfDay(new Date());
  const store = createStore<DatePickerSnapshot>({
    open: false,
    view: initial.type,
    viewDate: now,
    focusDate: now,
    today: now,
  });
  let options = initial;
  let trigger: HTMLElement | null = null;
  let panel: HTMLElement | null = null;
  /** 下一轮 DOM 画完之后要不要把焦点挪到当前格 */
  let pendingFocus = false;

  function viewOptions(): DatePickerViewOptions {
    const state = store.get();
    return {
      type: options.type,
      view: state.view,
      format: options.format,
      value: options.value,
      viewDate: state.viewDate,
      focusDate: state.focusDate,
      today: state.today,
      firstDayOfWeek: options.firstDayOfWeek,
      disabledDate: options.disabledDate,
    };
  }

  function selected(): Date | null {
    return toDate(options.value, options.format);
  }

  /** 真去挪焦点；面板还没挂上就什么都不做，待办留着下一轮 */
  function tryFocus(): void {
    if (!pendingFocus || !panel) return;
    const key = datePickerView(viewOptions()).tabStopKey;
    const cell = panel.querySelector<HTMLElement>(`[data-key="${key}"]`);
    if (!cell) return;
    pendingFocus = false;
    cell.focus();
  }

  function setOpen(next: boolean): void {
    if (store.get().open === next) return;
    store.set({ open: next });
    options.onVisibleChange(next);
    if (!next) {
      // 收起了就把没兑现的挪焦点待办丢掉，免得下次面板一出现就乱抢焦点
      pendingFocus = false;
      return;
    }
    // 打开时把「今天」校准一遍，跨午夜还开着的页面才不会标错
    const today = startOfDay(new Date());
    const anchor = selected() ?? today;
    store.set({
      today,
      view: options.type,
      viewDate: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
      focusDate: anchor,
    });
    pendingFocus = true;
  }

  function close(refocus: boolean): void {
    setOpen(false);
    if (refocus) trigger?.focus();
  }

  function pick(date: Date): void {
    options.onCommit(formatDate(date, options.format));
    close(true);
  }

  /** 键盘把焦点挪到另一格，越出当前页时顺带翻页 */
  function moveFocus(next: Date): void {
    const view = store.get().view;
    store.set({
      focusDate: next,
      viewDate:
        view === "date"
          ? new Date(next.getFullYear(), next.getMonth(), 1)
          : new Date(next.getFullYear(), store.get().viewDate.getMonth(), 1),
    });
    pendingFocus = true;
  }

  function focusMonth(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    store.set({
      focusDate: new Date(
        year,
        month,
        Math.min(store.get().focusDate.getDate(), daysInMonth(year, month)),
      ),
    });
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    // 面板没有全局监听：外部点击由 MPopper 上报，Escape 在面板自己的 keydown 里处理。
    // 这一对留成空壳只是为了凑齐控制器的形状，两个壳的胶水才能一视同仁地用
    connect() {},
    disconnect() {},

    setTrigger(el) {
      trigger = el;
    },
    setPanel(el) {
      panel = el;
      // 面板是刚挂上来的这一下就得接住：React 的过渡组件之后不会再触发壳的 effect
      tryFocus();
    },

    flushFocus: tryFocus,

    toggle() {
      if (options.disabled) return;
      setOpen(!store.get().open);
    },
    close,

    shiftView(months) {
      store.set({ viewDate: addMonths(store.get().viewDate, months) });
    },
    setView(view) {
      store.set({ view });
    },

    pick,

    pickMonth(date) {
      if (options.type === "month") {
        pick(date);
        return;
      }
      store.set({ viewDate: date });
      focusMonth(date);
      store.set({ view: "date" });
      pendingFocus = true;
    },

    pickYear(date) {
      if (options.type === "year") {
        pick(date);
        return;
      }
      const month = store.get().viewDate.getMonth();
      store.set({ viewDate: new Date(date.getFullYear(), month, 1) });
      store.set({ focusDate: new Date(date.getFullYear(), store.get().focusDate.getMonth(), 1) });
      store.set({ view: "month" });
      pendingFocus = true;
    },

    clear() {
      options.onCommit(null);
      options.onClear();
    },

    focusDay(date) {
      store.set({ focusDate: date });
    },
    focusMonth,
    focusYear(date) {
      store.set({
        focusDate: new Date(date.getFullYear(), store.get().focusDate.getMonth(), 1),
      });
    },

    onPanelKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      const focus = store.get().focusDate;
      const view = store.get().view;
      const isDate = view === "date";
      const isMonth = view === "month";
      const step = (amount: number) =>
        isDate
          ? addDays(focus, amount)
          : isMonth
            ? addMonths(focus, amount)
            : addMonths(focus, amount * 12);
      // 月 / 年面板是 4 列，上下键跨一行就是 4 格
      const rowStep = isDate ? 7 : 4;
      let next: Date | undefined;
      switch (event.key) {
        case "ArrowLeft":
          next = step(-1);
          break;
        case "ArrowRight":
          next = step(1);
          break;
        case "ArrowUp":
          next = step(-rowStep);
          break;
        case "ArrowDown":
          next = step(rowStep);
          break;
        case "PageUp":
          next = isDate
            ? addMonths(focus, -1)
            : isMonth
              ? addMonths(focus, -12)
              : addMonths(focus, -144);
          break;
        case "PageDown":
          next = isDate
            ? addMonths(focus, 1)
            : isMonth
              ? addMonths(focus, 12)
              : addMonths(focus, 144);
          break;
        case "Home":
          next = isDate ? new Date(focus.getFullYear(), focus.getMonth(), 1) : undefined;
          break;
        case "End":
          next = isDate
            ? new Date(
                focus.getFullYear(),
                focus.getMonth(),
                daysInMonth(focus.getFullYear(), focus.getMonth()),
              )
            : undefined;
          break;
      }
      if (!next) return;
      event.preventDefault();
      moveFocus(next);
    },

    onTriggerKeydown(event) {
      if (event.key !== "ArrowDown" || store.get().open) return;
      event.preventDefault();
      if (options.disabled) return;
      setOpen(true);
    },

    onClickOutside() {
      close(false);
    },
  };
}
