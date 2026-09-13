import { useCallback, useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import {
  createSelect,
  selectActiveId,
  selectClasses,
  selectHasSearch,
  selectIsSelected,
  selectOptionClasses,
  selectOptionId,
  selectSearchPlaceholder,
  selectSearchValue,
  selectShowClear,
  selectView,
  SELECT_CLEAR_LABEL,
  SELECT_DROPDOWN_BRUSH,
  SELECT_EMPTY_TEXT,
  SELECT_LOADING_TEXT,
  SELECT_MAX_HEIGHT,
  SELECT_PLACEHOLDER,
  SELECT_TRIGGER_BRUSH,
  type SelectNormalizedOption,
  type SelectOptionLike,
  type SelectOptionScope,
  type SelectProps as CoreSelectProps,
  type SelectModel,
  type SelectValue,
} from "@shuimo-design/core";
import { IconCheck, IconChevronDown, IconClose, IconLoading } from "../../icons";
import { useBrushBorder } from "../../ink";
import { MPopper } from "../../internal/MPopper";
import { MTag } from "../tag";
import { useController } from "../../runtime";

/** V 从 value / onValueChange 推，Multiple 从 multiple 属性推，和 core 的 SelectModel 一致 */
export interface MSelectProps<
  V extends SelectValue = SelectValue,
  Multiple extends boolean = boolean,
> extends CoreSelectProps<Multiple> {
  /** 受控值；不传就由组件自己记（配合 defaultValue） */
  value?: SelectModel<V, Multiple>;
  defaultValue?: SelectModel<V, Multiple>;
  onValueChange?: (value: SelectModel<V, Multiple>) => void;
  /** 选中值变化 */
  onChange?: (value: SelectModel<V, Multiple>) => void;
  /** 点选了某个选项，参数是原始选项（多选时取消勾选也会触发） */
  onSelect?: (option: SelectOptionLike) => void;
  /** 过滤框里的文字变化 */
  onInput?: (value: string) => void;
  /** 下拉开合 */
  onVisibleChange?: (open: boolean) => void;
  /** 多选时点了 Tag 的关闭 */
  onRemoveTag?: (value: V) => void;
  /** 点了清空按钮 */
  onClear?: () => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  /** 自定义选项内容，对应 Vue 的 `#option="{ option, label, selected }"` 作用域插槽 */
  renderOption?: (scope: SelectOptionScope) => ReactNode;
  /** 无数据时的内容 */
  empty?: ReactNode;
  /** 触发区前的内容（图标） */
  prefix?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MSelect<V extends SelectValue = SelectValue, Multiple extends boolean = false>(
  props: MSelectProps<V, Multiple>,
) {
  const {
    options,
    optionParam,
    valueParam,
    inputParam,
    toMatch,
    placeholder = SELECT_PLACEHOLDER,
    disabled = false,
    clearable = false,
    multiple = false as Multiple,
    filterable = false,
    filter,
    loading = false,
    fetch,
    emptyText = SELECT_EMPTY_TEXT,
    maxHeight = SELECT_MAX_HEIGHT,
    teleport = true,
    renderOption,
    empty,
    prefix,
  } = props;

  // 受控与否看的是有没有传 `value` 这个键，不是它等不等于 undefined：
  // 单选清空之后值本来就是 undefined，用 `!== undefined` 判断会让受控的选择器清空后突然变成非受控
  const controlled = "value" in props;
  const [uncontrolled, setUncontrolled] = useState<SelectModel<V, Multiple> | undefined>(
    props.defaultValue,
  );
  const model = controlled ? props.value : uncontrolled;

  const listboxId = useId();

  // 展开、聚焦、过滤文字、高亮项、正在拉下一页全在 core 的控制器里，和 Vue 那边同一份
  const [select, state] = useController(createSelect, {
    options,
    optionParam,
    valueParam,
    inputParam,
    toMatch,
    filter,
    filterable,
    multiple,
    disabled,
    value: model,
    fetch,
    // 控制器给的是所有形状的并集，按本组件的 V / Multiple 收窄一次
    onCommit: (next: SelectValue | SelectValue[] | undefined) => {
      const narrowed = next as SelectModel<V, Multiple>;
      if (!controlled) setUncontrolled(narrowed);
      props.onValueChange?.(narrowed);
      props.onChange?.(narrowed);
    },
    onSelect: (option: SelectOptionLike) => props.onSelect?.(option),
    onInput: (value: string) => props.onInput?.(value),
    onVisibleChange: (open: boolean) => props.onVisibleChange?.(open),
    onRemoveTag: (value: SelectValue) => props.onRemoveTag?.(value as V),
    onClear: () => props.onClear?.(),
    onFocus: (event: FocusEvent) => props.onFocus?.(event),
    onBlur: (event: FocusEvent) => props.onBlur?.(event),
  });

  // 触发器和输入框共用一套细笔触参数，同一张表单里边框粗细才一致
  const triggerBrush = useBrushBorder(SELECT_TRIGGER_BRUSH);
  // 下拉面板被传送到 body，边框要套在面板容器自己身上；面板每次打开都是新元素，控制器会重新落笔
  const dropdownBrush = useBrushBorder(SELECT_DROPDOWN_BRUSH);

  // 根元素既是控制器判断「焦点还在不在组件里」的依据，也是下拉的定位参照，所以要进 state
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的元素会来回换
  const rootRef = useCallback(
    (el: HTMLElement | null) => {
      setRootEl(el);
      select.setRoot(el);
    },
    [select],
  );
  const triggerRef = useCallback(
    (el: HTMLElement | null) => {
      triggerBrush(el);
      select.setTrigger(el);
    },
    [triggerBrush, select],
  );
  const searchRef = useCallback((el: HTMLInputElement | null) => select.setSearch(el), [select]);
  const listRef = useCallback((el: HTMLElement | null) => select.setList(el), [select]);

  // 高亮换了要把那一项滚进视野；useEffect 跑在 DOM 提交之后，等价于 Vue 的 flush: "post"
  useEffect(() => select.scrollActiveIntoView(), [select, state.activeIndex]);

  // 归一化、过滤、选中判断一次算完；控制器内部处理键盘时调的是同一个 selectView
  const view = selectView({
    options,
    optionParam,
    valueParam,
    inputParam,
    toMatch,
    filter,
    filterable,
    multiple,
    value: model,
    query: state.query,
  });
  const open = state.open;
  const isSelected = (option: SelectNormalizedOption) =>
    selectIsSelected(option, view.selectedValues, toMatch);

  return (
    <div
      ref={rootRef}
      className={[
        ...selectClasses({ open, focused: state.focused, disabled, multiple, filterable }),
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
      onFocus={(e) => select.onFocusin(e.nativeEvent)}
      onBlur={(e) => select.onFocusout(e.nativeEvent)}
      onKeyDown={(e) => select.onKeydown(e.nativeEvent)}
    >
      <div
        ref={triggerRef}
        className="m-select__trigger"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={selectActiveId(listboxId, state)}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={(e) => select.onTriggerClick(e.nativeEvent)}
        onFocus={(e) => select.onTriggerFocus(e.nativeEvent)}
      >
        {prefix ? <span className="m-select__prefix">{prefix}</span> : null}
        <div className="m-select__content">
          {multiple
            ? view.selectedOptions.map((option) => (
                <MTag
                  key={option.key}
                  className="m-select__tag"
                  size="sm"
                  closable
                  disabled={disabled}
                  onClose={() => select.removeTag(option.value)}
                >
                  {option.inputLabel}
                </MTag>
              ))
            : null}
          {!multiple && !filterable ? (
            <span
              className={["m-select__label", view.hasValue ? "" : "m-select__placeholder"]
                .filter(Boolean)
                .join(" ")}
            >
              {view.hasValue ? view.singleLabel : placeholder}
            </span>
          ) : null}
          {selectHasSearch({ multiple, filterable }) ? (
            <input
              ref={searchRef}
              className="m-select__search"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={selectSearchValue({
                multiple,
                open,
                query: state.query,
                singleLabel: view.singleLabel,
              })}
              placeholder={selectSearchPlaceholder({
                multiple,
                open,
                hasValue: view.hasValue,
                singleLabel: view.singleLabel,
                placeholder,
              })}
              readOnly={!filterable}
              disabled={disabled}
              onChange={(e) => select.onSearchInput(e.nativeEvent)}
            />
          ) : null}
        </div>
        <span className="m-select__suffix">
          {selectShowClear({ clearable, disabled, hasValue: view.hasValue }) ? (
            <button
              type="button"
              className="m-select__clear"
              aria-label={SELECT_CLEAR_LABEL}
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                select.clear();
              }}
            >
              <IconClose />
            </button>
          ) : null}
          <span className="m-select__arrow" aria-hidden="true">
            <IconChevronDown className="m-select__arrow-icon" />
            <span className="m-select__arrow-ink" />
          </span>
        </span>
      </div>
      <MPopper
        open={open}
        reference={rootEl}
        matchWidth
        role="listbox"
        teleport={teleport}
        onClickOutside={select.onClickOutside}
      >
        <div
          ref={dropdownBrush}
          className="m-select__dropdown"
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="m-select__loading">
              <IconLoading />
              <span>{SELECT_LOADING_TEXT}</span>
            </div>
          ) : view.visible.length > 0 ? (
            <ul
              id={listboxId}
              ref={listRef}
              className="m-select__options"
              role="presentation"
              style={{ maxHeight: `${maxHeight}px` }}
              onScroll={select.onListScroll}
            >
              {view.visible.map((option, index) => {
                const selected = isSelected(option);
                const scope: SelectOptionScope = {
                  option: option.raw,
                  label: option.label,
                  selected,
                };
                return (
                  <li
                    key={option.key}
                    id={selectOptionId(listboxId, index)}
                    className={selectOptionClasses({
                      active: index === state.activeIndex,
                      selected,
                      disabled: option.disabled,
                    }).join(" ")}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={option.disabled || undefined}
                    onClick={() => select.choose(option)}
                    onMouseMove={() => select.setActiveIndex(index)}
                  >
                    {renderOption ? (
                      renderOption(scope)
                    ) : (
                      <span className="m-select__option-label">{option.label}</span>
                    )}
                    {multiple && selected ? <IconCheck className="m-select__check" /> : null}
                  </li>
                );
              })}
              {state.fetching ? (
                <li className="m-select__fetching" role="presentation">
                  <IconLoading />
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="m-select__empty">{empty ?? emptyText}</div>
          )}
        </div>
      </MPopper>
    </div>
  );
}
