import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  createDatePicker,
  datePickerCellClasses,
  datePickerClasses,
  datePickerFormat,
  datePickerPageLabel,
  datePickerPageStep,
  datePickerPanelInkStyle,
  datePickerShowClear,
  datePickerView,
  DATE_PICKER_CLEAR_LABEL,
  DATE_PICKER_NEXT_MONTH_LABEL,
  DATE_PICKER_PANEL_BRUSH,
  DATE_PICKER_PLACEHOLDER,
  DATE_PICKER_PREV_MONTH_LABEL,
  DATE_PICKER_TRIGGER_BRUSH,
  type DatePickerCell,
  type DatePickerProps as CoreDatePickerProps,
} from "@shuimo-design/core";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconClose,
} from "../../icons";
import { useBrushBorder } from "../../ink";
import { MPopper } from "../../internal/MPopper";
import { useController } from "../../runtime";

export interface MDatePickerProps extends CoreDatePickerProps {
  /** 受控值；不传就由组件自己记（配合 defaultValue）。进来可以是格式化字符串或 Date 对象 */
  value?: string | Date | null;
  defaultValue?: string | Date | null;
  /** 值变化，参数是格式化后的字符串，清空为 null */
  onValueChange?: (value: string | null) => void;
  onChange?: (value: string | null) => void;
  /** 面板开合 */
  onVisibleChange?: (open: boolean) => void;
  /** 点了清空按钮 */
  onClear?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function MDatePicker(props: MDatePickerProps) {
  const {
    type = "date",
    format: formatProp,
    placeholder = DATE_PICKER_PLACEHOLDER,
    disabled = false,
    clearable = true,
    disabledDate,
    firstDayOfWeek = 0,
    teleport = true,
  } = props;

  // 受控与否看的是有没有传 `value` 这个键：清空之后值是 null，
  // 用「等不等于 undefined」判断会把「受控但当前为空」误判成非受控
  const controlled = "value" in props;
  const [uncontrolled, setUncontrolled] = useState<string | Date | null | undefined>(
    props.defaultValue,
  );
  const model = controlled ? props.value : uncontrolled;
  const format = datePickerFormat(type, formatProp);

  // 展开、看的是日 / 月 / 年、正在看哪个月、键盘焦点落在哪天全在 core 的控制器里，
  // 和 Vue 那边同一份
  const [picker, state] = useController(createDatePicker, {
    type,
    format,
    value: model,
    firstDayOfWeek,
    disabled,
    disabledDate,
    onCommit: (next: string | null) => {
      if (!controlled) setUncontrolled(next);
      props.onValueChange?.(next);
      props.onChange?.(next);
    },
    onVisibleChange: (open: boolean) => props.onVisibleChange?.(open),
    onClear: () => props.onClear?.(),
  });

  // 触发器和输入框共用一套细笔触参数，同一张表单里边框粗细才一致
  const triggerBrush = useBrushBorder(DATE_PICKER_TRIGGER_BRUSH);
  // 面板被传送到 body，边框要套在面板容器自己身上；每次打开都是新元素，控制器会重新落笔
  const panelBrush = useBrushBorder(DATE_PICKER_PANEL_BRUSH);

  // 根元素是面板的定位参照，所以要进 state
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的元素会来回换
  const triggerRef = useCallback(
    (el: HTMLElement | null) => {
      triggerBrush(el);
      picker.setTrigger(el);
    },
    [triggerBrush, picker],
  );
  const panelRef = useCallback(
    (el: HTMLElement | null) => {
      panelBrush(el);
      picker.setPanel(el);
    },
    [panelBrush, picker],
  );

  // 挪焦点要等这一轮 DOM 画完；ref 回调跑在 effect 之前，所以这里拿到的面板一定是新的那个。
  // 没待办时是空操作
  useEffect(() => picker.flushFocus());

  // 月历、月格年格、文案一次算完
  const calendar = datePickerView({
    type,
    view: state.view,
    format,
    value: model,
    viewDate: state.viewDate,
    focusDate: state.focusDate,
    today: state.today,
    firstDayOfWeek,
    disabledDate,
  });

  /** 三种格子长得一样，只是 class 的那一档、aria 和点下去做什么不同 */
  const cellButton = (cell: DatePickerCell, unit: "date" | "month" | "year") => (
    <button
      key={cell.key}
      type="button"
      className={datePickerCellClasses({
        unit,
        outside: cell.outside,
        today: cell.today,
        selected: cell.selected,
        disabled: cell.disabled,
      }).join(" ")}
      role="gridcell"
      aria-selected={cell.selected}
      aria-label={cell.label}
      disabled={cell.disabled}
      tabIndex={cell.key === calendar.tabStopKey ? 0 : -1}
      data-key={cell.key}
      onFocus={() => {
        if (unit === "date") picker.focusDay(cell.date);
        else if (unit === "month") picker.focusMonth(cell.date);
        else picker.focusYear(cell.date);
      }}
      onClick={() => {
        if (unit === "date") picker.pick(cell.date);
        else if (unit === "month") picker.pickMonth(cell.date);
        else picker.pickYear(cell.date);
      }}
    >
      {cell.text}
    </button>
  );

  const grid = (rows: DatePickerCell[][], unit: "date" | "month" | "year") =>
    rows.map((row, rowIndex) => (
      <div key={rowIndex} className="m-date-picker__row" role="row">
        {row.map((cell) => cellButton(cell, unit))}
      </div>
    ));

  return (
    <div
      ref={setRootEl}
      className={[...datePickerClasses({ open: state.open, disabled }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
    >
      <button
        ref={triggerRef}
        type="button"
        className="m-date-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={state.open}
        disabled={disabled}
        onClick={picker.toggle}
        onKeyDown={(e) => picker.onTriggerKeydown(e.nativeEvent)}
      >
        <IconCalendar className="m-date-picker__icon" />
        <span
          className={[
            "m-date-picker__text",
            calendar.displayText ? "" : "m-date-picker__placeholder",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {calendar.displayText || placeholder}
        </span>
      </button>
      {datePickerShowClear({ clearable, disabled, displayText: calendar.displayText }) ? (
        <button
          type="button"
          className="m-date-picker__clear"
          aria-label={DATE_PICKER_CLEAR_LABEL}
          tabIndex={-1}
          onClick={picker.clear}
        >
          <IconClose />
        </button>
      ) : null}
      <MPopper
        open={state.open}
        reference={rootEl}
        role="dialog"
        teleport={teleport}
        onClickOutside={picker.onClickOutside}
      >
        <div
          ref={panelRef}
          className="m-date-picker__panel"
          style={datePickerPanelInkStyle() as CSSProperties}
          onKeyDown={(e) => picker.onPanelKeydown(e.nativeEvent)}
        >
          <header className="m-date-picker__header">
            <button
              type="button"
              className="m-date-picker__nav m-date-picker__nav--prev-year"
              aria-label={datePickerPageLabel(state.view, -1)}
              onClick={() => picker.shiftView(datePickerPageStep(state.view, -1))}
            >
              <IconChevronsLeft className="m-date-picker__nav-icon" />
              <span className="m-date-picker__nav-ink" aria-hidden="true" />
            </button>
            {state.view === "date" ? (
              <button
                type="button"
                className="m-date-picker__nav m-date-picker__nav--prev-month"
                aria-label={DATE_PICKER_PREV_MONTH_LABEL}
                onClick={() => picker.shiftView(-1)}
              >
                <IconChevronLeft className="m-date-picker__nav-icon" />
                <span className="m-date-picker__nav-ink" aria-hidden="true" />
              </button>
            ) : null}
            <span className="m-date-picker__title">
              {state.view === "year" ? (
                <span className="m-date-picker__year">
                  {calendar.yearStart} – {calendar.yearStart + 11}
                </span>
              ) : (
                <button
                  type="button"
                  className="m-date-picker__year"
                  onClick={() => picker.setView("year")}
                >
                  {calendar.viewYear}年
                </button>
              )}
              {state.view === "date" ? (
                <button
                  type="button"
                  className="m-date-picker__month"
                  onClick={() => picker.setView("month")}
                >
                  {calendar.viewMonth + 1}月
                </button>
              ) : null}
            </span>
            {state.view === "date" ? (
              <button
                type="button"
                className="m-date-picker__nav m-date-picker__nav--next-month"
                aria-label={DATE_PICKER_NEXT_MONTH_LABEL}
                onClick={() => picker.shiftView(1)}
              >
                <IconChevronRight className="m-date-picker__nav-icon" />
                <span className="m-date-picker__nav-ink" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              className="m-date-picker__nav m-date-picker__nav--next-year"
              aria-label={datePickerPageLabel(state.view, 1)}
              onClick={() => picker.shiftView(datePickerPageStep(state.view, 1))}
            >
              <IconChevronsRight className="m-date-picker__nav-icon" />
              <span className="m-date-picker__nav-ink" aria-hidden="true" />
            </button>
          </header>

          {state.view === "date" ? (
            <>
              <div className="m-date-picker__weekdays" aria-hidden="true">
                {calendar.weekdays.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </div>
              <hr className="m-date-picker__divider" aria-hidden="true" />
              <div className="m-date-picker__grid" role="grid">
                {grid(calendar.rows, "date")}
              </div>
            </>
          ) : (
            <>
              <hr className="m-date-picker__divider" aria-hidden="true" />
              {state.view === "month" ? (
                <div className="m-date-picker__grid m-date-picker__grid--month" role="grid">
                  {grid(calendar.monthRows, "month")}
                </div>
              ) : (
                <div className="m-date-picker__grid m-date-picker__grid--year" role="grid">
                  {grid(calendar.yearRows, "year")}
                </div>
              )}
            </>
          )}
        </div>
      </MPopper>
    </div>
  );
}
