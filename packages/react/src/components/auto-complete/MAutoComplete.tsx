import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  autoCompleteActiveId,
  autoCompleteClasses,
  autoCompleteDropdownBrush,
  autoCompleteLabel,
  autoCompleteOptionClasses,
  autoCompleteOptionId,
  autoCompleteShowClear,
  autoCompleteVisible,
  AUTO_COMPLETE_CLEAR_LABEL,
  AUTO_COMPLETE_DEBOUNCE,
  AUTO_COMPLETE_SEED,
  AUTO_COMPLETE_TRIGGER_BRUSH,
  createAutoComplete,
  type AutoCompleteExpose,
  type AutoCompleteOption,
  type AutoCompleteOptionScope,
  type AutoCompleteProps as CoreAutoCompleteProps,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { MPopper } from "../../internal/MPopper";
import { useController } from "../../runtime";

export interface MAutoCompleteProps extends CoreAutoCompleteProps {
  /** 受控值（输入框里的文字）；不传就由组件自己记（配合 defaultValue） */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 输入或清空后的文字（防抖之后） */
  onSearch?: (input: string) => void;
  /** 选中了某一项 */
  onSelect?: (option: AutoCompleteOption) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  /** 点了清空按钮 */
  onClear?: () => void;
  /** 自定义每一项的内容，对应 Vue 的 `#option="{ option, active }"` 作用域插槽 */
  renderOption?: (scope: AutoCompleteOptionScope) => ReactNode;
  /** 输入框前的内容（图标） */
  prefix?: ReactNode;
  /** 输入框后的内容 */
  suffix?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const MAutoComplete = forwardRef<AutoCompleteExpose, MAutoCompleteProps>(
  function MAutoComplete(props, ref) {
    const {
      options,
      filter = true,
      placeholder,
      disabled: disabledProp = false,
      clearable = false,
      debounce = AUTO_COMPLETE_DEBOUNCE,
      placement = "bottom-start",
      teleport = true,
      emptyText = "",
      seed = AUTO_COMPLETE_SEED,
      renderOption,
      prefix,
      suffix,
    } = props;

    // 上下文形状在 core（context/form-item.ts），这两行只是 React 的 useContext 胶水
    const formItem = useFormItem();
    const disabled = useDisabled(disabledProp);

    // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
    const controlled = props.value !== undefined;
    const [uncontrolled, setUncontrolled] = useState(props.defaultValue ?? "");
    const model = props.value ?? uncontrolled;

    const listboxId = useId();

    // 展开、聚焦、高亮项、search 的防抖全在 core 的控制器里，和 Vue 那边同一份
    const [ac, state] = useController(createAutoComplete, {
      options,
      filter,
      value: model,
      disabled,
      debounce,
      emptyText,
      onCommit: (next: string) => {
        if (!controlled) setUncontrolled(next);
        props.onValueChange?.(next);
        formItem.validate("change");
      },
      onSearch: (value: string) => props.onSearch?.(value),
      onSelect: (option: AutoCompleteOption) => props.onSelect?.(option),
      onFocus: (event: FocusEvent) => props.onFocus?.(event),
      onBlur: (event: FocusEvent) => {
        props.onBlur?.(event);
        formItem.validate("blur");
      },
      onClear: () => props.onClear?.(),
    });

    // 输入框和其他表单控件共用一套细笔触参数，同一张表单里边框粗细才一致
    const triggerBrush = useBrushBorder(AUTO_COMPLETE_TRIGGER_BRUSH);
    // 下拉面板被传送到 body，边框要套在面板容器自己身上；面板每次打开都是新元素，控制器会重新落笔
    const dropdownBrush = useBrushBorder(autoCompleteDropdownBrush(seed));

    // 根元素既是控制器判断「焦点还在不在组件里」的依据，也是下拉的定位参照，所以要进 state
    const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
    // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的元素会来回换
    const rootRef = useCallback(
      (el: HTMLElement | null) => {
        setRootEl(el);
        ac.setRoot(el);
      },
      [ac],
    );
    const inputRef = useCallback((el: HTMLInputElement | null) => ac.setInput(el), [ac]);
    const listRef = useCallback((el: HTMLElement | null) => ac.setList(el), [ac]);

    // 高亮换了要把那一项滚进视野；useEffect 跑在 DOM 提交之后，等价于 Vue 的 flush: "post"
    useEffect(() => ac.scrollActiveIntoView(), [ac, state.activeIndex]);

    // 和 Vue 的 defineExpose({ focus, blur }) 对齐
    useImperativeHandle(ref, () => ({ focus: () => ac.focus(), blur: () => ac.blur() }), [ac]);

    // 过滤是纯函数；控制器内部处理键盘时调的是同一个 autoCompleteVisible
    const visible = autoCompleteVisible(options, model, filter);
    const open = state.open;
    const showClear = autoCompleteShowClear({ clearable, disabled, value: model });

    return (
      <div
        ref={rootRef}
        className={[
          ...autoCompleteClasses({ open, focused: state.focused, disabled }),
          props.className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={props.style}
        onFocus={(e) => ac.onFocusin(e.nativeEvent)}
        onBlur={(e) => ac.onFocusout(e.nativeEvent)}
        onKeyDown={(e) => ac.onKeydown(e.nativeEvent)}
      >
        <div
          ref={triggerBrush}
          className="m-auto-complete__trigger"
          onMouseDown={(e) => ac.onTriggerMousedown(e.nativeEvent)}
        >
          {prefix ? <span className="m-auto-complete__prefix">{prefix}</span> : null}
          <input
            id={formItem.id}
            ref={inputRef}
            className="m-auto-complete__input"
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={autoCompleteActiveId(listboxId, state)}
            value={model}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => ac.onInput(e.nativeEvent)}
          />
          {showClear || suffix ? (
            <span className="m-auto-complete__suffix">
              {showClear ? (
                <button
                  type="button"
                  className="m-auto-complete__clear"
                  aria-label={AUTO_COMPLETE_CLEAR_LABEL}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => ac.clear()}
                >
                  <IconClose />
                </button>
              ) : null}
              {suffix}
            </span>
          ) : null}
        </div>
        <MPopper
          open={open}
          reference={rootEl}
          placement={placement}
          matchWidth
          teleport={teleport}
          onClickOutside={ac.onClickOutside}
        >
          <div
            id={listboxId}
            ref={dropdownBrush}
            className="m-auto-complete__dropdown"
            role="listbox"
            onMouseDown={(e) => e.preventDefault()}
          >
            {visible.length > 0 ? (
              <ul ref={listRef} className="m-auto-complete__options" role="presentation">
                {visible.map((option, index) => {
                  const active = index === state.activeIndex;
                  return (
                    <li
                      key={option.value}
                      id={autoCompleteOptionId(listboxId, index)}
                      className={autoCompleteOptionClasses({
                        active,
                        disabled: option.disabled ?? false,
                      }).join(" ")}
                      role="option"
                      aria-selected={active}
                      aria-disabled={option.disabled || undefined}
                      onClick={() => ac.choose(option)}
                      onMouseMove={() => ac.setActiveIndex(index)}
                    >
                      {renderOption ? (
                        renderOption({ option, active })
                      ) : (
                        <span className="m-auto-complete__option-label">
                          {autoCompleteLabel(option)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="m-auto-complete__empty">{emptyText}</div>
            )}
          </div>
        </MPopper>
      </div>
    );
  },
);
