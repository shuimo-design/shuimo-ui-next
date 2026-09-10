<script setup lang="ts">
import "./date-picker.css";
import { computed, nextTick, ref, useTemplateRef } from "vue";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconClose,
} from "../../icons";
import { brushLineUrl, inkEnsoUrl, inkMarkUrl } from "../../ink/assets";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { FIELD_STROKE } from "../../internal/field-stroke";
import { useBrushBorder } from "../../ink/stroke";
import MPopper from "../../internal/popper/MPopper.vue";
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
} from "./date";
import type { DatePickerEmits, DatePickerProps, DatePickerType } from "./types";

defineOptions({ name: "MDatePicker" });

const {
  type = "date",
  format: formatProp,
  placeholder = "请选择日期",
  disabled: disabledProp = false,
  clearable = true,
  disabledDate,
  firstDayOfWeek = 0,
  teleport = true,
} = defineProps<DatePickerProps>();
const emit = defineEmits<DatePickerEmits>();
/** 进来可以是格式化字符串或 Date 对象，写回去一律是格式化字符串（和旧版一致） */
const model = defineModel<string | Date | null>();

const DEFAULT_FORMAT: Record<DatePickerType, string> = {
  date: "YYYY-MM-DD",
  month: "YYYY-MM",
  year: "YYYY",
};
const MONTH_NAMES = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
/** 面板宽度里能放 7 格的那条分割线长度，和 CSS 里的格宽 32px × 7 对应 */
const DIVIDER_LENGTH = 224;

const formItem = useFormItem();
const disabled = useDisabled(() => disabledProp);
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLButtonElement>("trigger");
// 触发器和输入框共用一套细笔触参数，同一张表单里边框粗细才一致
useBrushBorder(trigger, FIELD_STROKE);
// 面板被 Teleport 到 body，边框要套在面板容器自己身上；每次打开都是新元素，useBrushBorder 会重新落笔
const panel = useTemplateRef<HTMLElement>("panel");
useBrushBorder(panel, { strokeWidth: 2, seed: 3 });

// 面板里的水墨素材：选中日期的禅圈、翻页箭头、周名下的分割线。
// 面板在 body 下拿不到组件根上的变量，所以直接写成面板容器的行内变量
const divider = brushLineUrl({ seed: 4, length: DIVIDER_LENGTH, thickness: 2 });
const panelInkStyle = {
  "--m-date-picker-ring": `url("${inkEnsoUrl({ seed: 7, size: 32, strokeWidth: 3.2 })}")`,
  "--m-date-picker-mark-prev-year": `url("${inkMarkUrl("chevronsLeft", { seed: 2 })}")`,
  "--m-date-picker-mark-prev-month": `url("${inkMarkUrl("chevronLeft", { seed: 2 })}")`,
  "--m-date-picker-mark-next-month": `url("${inkMarkUrl("chevronRight", { seed: 2 })}")`,
  "--m-date-picker-mark-next-year": `url("${inkMarkUrl("chevronsRight", { seed: 2 })}")`,
  "--m-date-picker-divider": `url("${divider.url}")`,
  "--m-date-picker-divider-band": `${divider.height}px`,
};

const open = ref(false);
/** 当前显示的是日 / 月 / 年面板 */
const view = ref<DatePickerType>(type);
/** 面板正在看的月份（取当月 1 日） */
const viewDate = ref(startOfDay(new Date()));
/** 键盘焦点所在的日期（roving tabindex） */
const focusDate = ref(startOfDay(new Date()));
const today = ref(startOfDay(new Date()));

const format = computed(() => formatProp ?? DEFAULT_FORMAT[type]);
const selected = computed(() => toDate(model.value, format.value));
/** 触发区显示的文字：能解析就按 format 重排，解析不了的字符串原样给回去 */
const displayText = computed(() => {
  if (selected.value) return formatDate(selected.value, format.value);
  return typeof model.value === "string" ? model.value : "";
});
const showClear = computed(() => clearable && !disabled.value && !!displayText.value);
const viewYear = computed(() => viewDate.value.getFullYear());
const viewMonth = computed(() => viewDate.value.getMonth());
const yearStart = computed(() => yearPageStart(viewYear.value));
const weekdays = computed(() => weekdayNames(firstDayOfWeek));

const calendar = computed(() =>
  buildCalendar(viewYear.value, viewMonth.value, {
    firstDayOfWeek,
    selected: selected.value,
    today: today.value,
    isDisabled: disabledDate,
  }),
);
const rows = computed(() =>
  Array.from({ length: 6 }, (_, row) => calendar.value.slice(row * 7, row * 7 + 7)),
);
const months = computed(() =>
  MONTH_NAMES.map((name, month) => {
    const date = new Date(viewYear.value, month, 1);
    return {
      date,
      label: `${name}月`,
      key: keyOf(date, "month"),
      selected:
        !!selected.value &&
        selected.value.getFullYear() === viewYear.value &&
        selected.value.getMonth() === month,
      today: today.value.getFullYear() === viewYear.value && today.value.getMonth() === month,
      disabled: type === "month" && (disabledDate?.(date) ?? false),
    };
  }),
);
const years = computed(() =>
  Array.from({ length: 12 }, (_, offset) => {
    const year = yearStart.value + offset;
    const date = new Date(year, 0, 1);
    return {
      date,
      label: String(year),
      key: keyOf(date, "year"),
      selected: selected.value?.getFullYear() === year,
      today: today.value.getFullYear() === year,
      disabled: type === "year" && (disabledDate?.(date) ?? false),
    };
  }),
);

function keyOf(date: Date, unit: DatePickerType = view.value) {
  return formatDate(date, DEFAULT_FORMAT[unit]);
}

/** 当前面板里该拿 tabindex=0 的格子：焦点日在视图内就是它，否则退到本页第一格 */
const tabStopKey = computed(() => {
  const focus = focusDate.value;
  if (view.value === "date") {
    const inView = calendar.value.some((cell) => sameDay(cell.date, focus));
    const first = calendar.value.find((cell) => cell.inMonth)?.date ?? viewDate.value;
    return keyOf(inView ? focus : first, "date");
  }
  if (view.value === "month") {
    const inView = focus.getFullYear() === viewYear.value;
    return keyOf(inView ? focus : viewDate.value, "month");
  }
  const inView = yearPageStart(focus.getFullYear()) === yearStart.value;
  return keyOf(inView ? focus : new Date(yearStart.value, 0, 1), "year");
});

async function focusCell() {
  await nextTick();
  panel.value?.querySelector<HTMLElement>(`[data-key="${tabStopKey.value}"]`)?.focus();
}

function setOpen(next: boolean) {
  if (open.value === next) return;
  open.value = next;
  emit("visibleChange", next);
  if (!next) return;
  const anchor = selected.value ?? today.value;
  today.value = startOfDay(new Date());
  view.value = type;
  viewDate.value = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  focusDate.value = anchor;
  void focusCell();
}

function toggle() {
  if (disabled.value) return;
  setOpen(!open.value);
}

function close(refocus: boolean) {
  setOpen(false);
  if (refocus) trigger.value?.focus();
}

function commit(next: string | null) {
  model.value = next;
  emit("change", next);
  formItem?.validate("change");
}

function pick(date: Date) {
  commit(formatDate(date, format.value));
  close(true);
}

function clear() {
  commit(null);
  emit("clear");
}

/** 头部箭头：按月 / 年 / 12 年翻页 */
function shiftView(months: number) {
  viewDate.value = addMonths(viewDate.value, months);
}

function pickMonth(date: Date) {
  if (type === "month") {
    pick(date);
    return;
  }
  viewDate.value = date;
  focusMonth(date);
  view.value = "date";
  void focusCell();
}

function pickYear(date: Date) {
  if (type === "year") {
    pick(date);
    return;
  }
  viewDate.value = new Date(date.getFullYear(), viewMonth.value, 1);
  focusYear(date);
  view.value = "month";
  void focusCell();
}

/** 键盘把焦点挪到另一格，越出当前页时顺带翻页 */
function moveFocus(next: Date) {
  focusDate.value = next;
  viewDate.value =
    view.value === "date"
      ? new Date(next.getFullYear(), next.getMonth(), 1)
      : new Date(next.getFullYear(), viewMonth.value, 1);
  void focusCell();
}

/** 焦点落到某个月格上时，把焦点日挪到那个月（日子尽量保留） */
function focusMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  focusDate.value = new Date(
    year,
    month,
    Math.min(focusDate.value.getDate(), daysInMonth(year, month)),
  );
}

function focusYear(date: Date) {
  focusDate.value = new Date(date.getFullYear(), focusDate.value.getMonth(), 1);
}

function onPanelKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    close(true);
    return;
  }
  const focus = focusDate.value;
  const isDate = view.value === "date";
  const isMonth = view.value === "month";
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
      next = isDate ? addMonths(focus, 1) : isMonth ? addMonths(focus, 12) : addMonths(focus, 144);
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
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown" && !open.value) {
    event.preventDefault();
    toggle();
  }
}

function cellLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
</script>

<template>
  <div
    ref="root"
    class="m-date-picker"
    :class="{ 'm-date-picker--open': open, 'm-date-picker--disabled': disabled }"
  >
    <button
      :id="formItem?.id.value"
      ref="trigger"
      type="button"
      class="m-date-picker__trigger"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <IconCalendar class="m-date-picker__icon" />
      <span class="m-date-picker__text" :class="{ 'm-date-picker__placeholder': !displayText }">
        {{ displayText || placeholder }}
      </span>
    </button>
    <button
      v-if="showClear"
      type="button"
      class="m-date-picker__clear"
      aria-label="清空"
      tabindex="-1"
      @click="clear"
    >
      <IconClose />
    </button>
    <MPopper
      :open="open"
      :reference="root"
      role="dialog"
      :teleport="teleport"
      @click-outside="close(false)"
    >
      <div
        ref="panel"
        class="m-date-picker__panel"
        :style="panelInkStyle"
        @keydown="onPanelKeydown"
      >
        <header class="m-date-picker__header">
          <button
            type="button"
            class="m-date-picker__nav m-date-picker__nav--prev-year"
            :aria-label="view === 'year' ? '上一页' : '上一年'"
            @click="shiftView(view === 'year' ? -144 : -12)"
          >
            <IconChevronsLeft class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
          <button
            v-if="view === 'date'"
            type="button"
            class="m-date-picker__nav m-date-picker__nav--prev-month"
            aria-label="上一月"
            @click="shiftView(-1)"
          >
            <IconChevronLeft class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
          <span class="m-date-picker__title">
            <button
              v-if="view !== 'year'"
              type="button"
              class="m-date-picker__year"
              @click="view = 'year'"
            >
              {{ viewYear }}年
            </button>
            <span v-else class="m-date-picker__year">{{ yearStart }} – {{ yearStart + 11 }}</span>
            <button
              v-if="view === 'date'"
              type="button"
              class="m-date-picker__month"
              @click="view = 'month'"
            >
              {{ viewMonth + 1 }}月
            </button>
          </span>
          <button
            v-if="view === 'date'"
            type="button"
            class="m-date-picker__nav m-date-picker__nav--next-month"
            aria-label="下一月"
            @click="shiftView(1)"
          >
            <IconChevronRight class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="m-date-picker__nav m-date-picker__nav--next-year"
            :aria-label="view === 'year' ? '下一页' : '下一年'"
            @click="shiftView(view === 'year' ? 144 : 12)"
          >
            <IconChevronsRight class="m-date-picker__nav-icon" />
            <span class="m-date-picker__nav-ink" aria-hidden="true" />
          </button>
        </header>

        <template v-if="view === 'date'">
          <div class="m-date-picker__weekdays" aria-hidden="true">
            <span v-for="name in weekdays" :key="name">{{ name }}</span>
          </div>
          <hr class="m-date-picker__divider" aria-hidden="true" />
          <div class="m-date-picker__grid" role="grid">
            <div
              v-for="(row, rowIndex) in rows"
              :key="rowIndex"
              class="m-date-picker__row"
              role="row"
            >
              <button
                v-for="cell in row"
                :key="keyOf(cell.date, 'date')"
                type="button"
                class="m-date-picker__cell"
                :class="{
                  'm-date-picker__cell--outside': !cell.inMonth,
                  'm-date-picker__cell--today': cell.today,
                  'm-date-picker__cell--selected': cell.selected,
                  'm-date-picker__cell--disabled': cell.disabled,
                }"
                role="gridcell"
                :aria-selected="cell.selected"
                :aria-label="cellLabel(cell.date)"
                :disabled="cell.disabled"
                :tabindex="keyOf(cell.date, 'date') === tabStopKey ? 0 : -1"
                :data-key="keyOf(cell.date, 'date')"
                @focus="focusDate = cell.date"
                @click="pick(cell.date)"
              >
                {{ cell.date.getDate() }}
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <hr class="m-date-picker__divider" aria-hidden="true" />
          <div
            v-if="view === 'month'"
            class="m-date-picker__grid m-date-picker__grid--month"
            role="grid"
          >
            <div v-for="row in 3" :key="row" class="m-date-picker__row" role="row">
              <button
                v-for="item in months.slice((row - 1) * 4, row * 4)"
                :key="item.key"
                type="button"
                class="m-date-picker__cell m-date-picker__cell--month"
                :class="{
                  'm-date-picker__cell--today': item.today,
                  'm-date-picker__cell--selected': item.selected,
                  'm-date-picker__cell--disabled': item.disabled,
                }"
                role="gridcell"
                :aria-selected="item.selected"
                :aria-label="`${viewYear}年${item.label}`"
                :disabled="item.disabled"
                :tabindex="item.key === tabStopKey ? 0 : -1"
                :data-key="item.key"
                @focus="focusMonth(item.date)"
                @click="pickMonth(item.date)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div v-else class="m-date-picker__grid m-date-picker__grid--year" role="grid">
            <div v-for="row in 3" :key="row" class="m-date-picker__row" role="row">
              <button
                v-for="item in years.slice((row - 1) * 4, row * 4)"
                :key="item.key"
                type="button"
                class="m-date-picker__cell m-date-picker__cell--year"
                :class="{
                  'm-date-picker__cell--today': item.today,
                  'm-date-picker__cell--selected': item.selected,
                  'm-date-picker__cell--disabled': item.disabled,
                }"
                role="gridcell"
                :aria-selected="item.selected"
                :aria-label="`${item.label}年`"
                :disabled="item.disabled"
                :tabindex="item.key === tabStopKey ? 0 : -1"
                :data-key="item.key"
                @focus="focusYear(item.date)"
                @click="pickYear(item.date)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </MPopper>
  </div>
</template>
