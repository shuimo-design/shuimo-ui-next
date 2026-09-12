import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import {
  formatNumber,
  inputNumberAriaBound,
  inputNumberBrush,
  inputNumberClasses,
  inputNumberInk,
  inputNumberStepDisabled,
  parseNumberText,
  sanitizeNumberText,
  stepNumber,
  INPUT_NUMBER_DECREASE_LABEL,
  INPUT_NUMBER_INCREASE_LABEL,
  type InputNumberExpose,
  type InputNumberProps as CoreInputNumberProps,
} from "@shuimo-design/core";
import { IconMinus, IconPlus } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useDisabled, useFormItem } from "../../internal/form-item";

/** 没被组件用掉的属性原样落到原生 input 上，对应 Vue 那边的 inheritAttrs: false */
type NativeAttrs = Omit<
  ComponentPropsWithoutRef<"input">,
  | "className"
  | "defaultValue"
  | "disabled"
  | "max"
  | "min"
  | "name"
  | "onBlur"
  | "onChange"
  | "onFocus"
  | "onInput"
  | "onKeyDown"
  | "placeholder"
  | "readOnly"
  | "step"
  | "style"
  | "type"
  | "value"
>;

export interface MInputNumberProps extends CoreInputNumberProps, NativeAttrs {
  /** 受控值；不传就由组件自己记（配合 defaultValue） */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number | undefined) => void;
  /** 值提交后（失焦、回车、按钮或方向键增减），参数是新值与旧值 */
  onChange?: (value: number | undefined, oldValue: number | undefined) => void;
  /** 每次键入，参数是清洗后的文本（可能是 `-`、`1.` 这类中间态） */
  onInput?: (value: string) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  style?: CSSProperties;
}

export const MInputNumber = forwardRef<InputNumberExpose, MInputNumberProps>(
  function MInputNumber(props, ref) {
    const {
      min = -Infinity,
      max = Infinity,
      step = 1,
      precision,
      disabled: disabledProp = false,
      readonly = false,
      placeholder,
      controls = true,
      name,
      value,
      defaultValue,
      onValueChange,
      onChange,
      onInput,
      onFocus,
      onBlur,
      onKeyDown,
      className,
      style,
      ...nativeAttrs
    } = props;

    // 上下文形状在 core（context/form-item.ts），这两行只是 React 的 useContext 胶水
    const formItem = useFormItem();
    const disabled = useDisabled(disabledProp);

    // 受控 / 非受控两种都支持。这里用"有没有传这个 prop"判断，不能用 value !== undefined：
    // 数字框的空值本来就是 undefined，受控的父组件清空时传的正是 undefined
    const isControlled = "value" in props;
    const [uncontrolled, setUncontrolled] = useState<number | undefined>(defaultValue);
    const model = isControlled ? value : uncontrolled;

    const [focused, setFocused] = useState(false);
    const native = useRef<HTMLInputElement>(null);
    // 外框和输入框共用同一套细笔触参数，两者并排时边框粗细一致
    const root = useBrushBorder(inputNumberBrush());
    // 加减号和中间那道短竖笔都在 core 里生成，两个壳共用同一份遮罩
    const inkStyle = inputNumberInk();

    /** 所有算术（钳制、取整、清洗、解析、步进）都在 core，这里只传边界 */
    const bounds = { min, max, precision };

    /** 显示的文本；输入过程中允许 `-`、`1.` 这类中间态 */
    const [text, setText] = useState(() => formatNumber(model, precision));
    // 绑定值从外面变了就重排文本。对应 Vue 的 watch(model)，
    // React 里"由 props 推导 state"的正规写法就是渲染期比一次上一轮的值
    const [prevModel, setPrevModel] = useState(model);
    if (prevModel !== model) {
      setPrevModel(model);
      setText(formatNumber(model, precision));
    }

    function write(next: number | undefined) {
      const old = model;
      setText(formatNumber(next, precision));
      if (next !== old) {
        if (!isControlled) setUncontrolled(next);
        onValueChange?.(next);
        onChange?.(next, old);
      }
      formItem.validate("change");
    }

    /** 提交：清洗文本写回绑定值，非法则回退到旧值 */
    function commit() {
      const parsed = parseNumberText(text, bounds);
      if (parsed !== undefined && Number.isNaN(parsed)) {
        setText(formatNumber(model, precision));
        return;
      }
      write(parsed);
    }

    function stepBy(direction: 1 | -1) {
      if (disabled || readonly) return;
      write(stepNumber({ text, value: model, step, direction, bounds }));
    }

    function handleInput(event: ChangeEvent<HTMLInputElement>) {
      const el = event.currentTarget;
      const next = sanitizeNumberText(el.value, precision);
      // 清洗后和上一轮同值时 React 不会重渲染，得自己把输入框里的非法字符抹掉
      if (el.value !== next) el.value = next;
      setText(next);
      onInput?.(next);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        stepBy(event.key === "ArrowUp" ? 1 : -1);
      } else if (event.key === "Enter") {
        commit();
      }
    }

    function handleFocus(event: FocusEvent<HTMLInputElement>) {
      setFocused(true);
      onFocus?.(event);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      setFocused(false);
      commit();
      onBlur?.(event);
      formItem.validate("blur");
    }

    // 和 Vue 的 defineExpose({ focus, blur, select }) 对齐
    useImperativeHandle(
      ref,
      () => ({
        focus: () => native.current?.focus(),
        blur: () => native.current?.blur(),
        select: () => native.current?.select(),
      }),
      [],
    );

    const classes = inputNumberClasses({ disabled, readonly, focused, controls });

    return (
      <div
        ref={root}
        className={[...classes, className].filter(Boolean).join(" ")}
        style={{ ...inkStyle, ...style } as CSSProperties}
      >
        {controls ? (
          <button
            type="button"
            className="m-input-number__decrease"
            aria-label={INPUT_NUMBER_DECREASE_LABEL}
            tabIndex={-1}
            disabled={inputNumberStepDisabled({
              direction: -1,
              value: model,
              disabled,
              readonly,
              min,
              max,
            })}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => stepBy(-1)}
          >
            <IconMinus className="m-input-number__icon" />
            <span
              className="m-input-number__glyph m-input-number__glyph--minus"
              aria-hidden="true"
            />
          </button>
        ) : null}
        <input
          {...nativeAttrs}
          ref={native}
          id={formItem.id}
          className="m-input-number__native"
          type="text"
          role="spinbutton"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          name={name}
          aria-valuenow={model}
          aria-valuemin={inputNumberAriaBound(min)}
          aria-valuemax={inputNumberAriaBound(max)}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {controls ? (
          <button
            type="button"
            className="m-input-number__increase"
            aria-label={INPUT_NUMBER_INCREASE_LABEL}
            tabIndex={-1}
            disabled={inputNumberStepDisabled({
              direction: 1,
              value: model,
              disabled,
              readonly,
              min,
              max,
            })}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => stepBy(1)}
          >
            <IconPlus className="m-input-number__icon" />
            <span
              className="m-input-number__glyph m-input-number__glyph--plus"
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>
    );
  },
);
