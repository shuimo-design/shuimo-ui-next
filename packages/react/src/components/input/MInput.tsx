import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  inputBrush,
  inputClasses,
  inputCount,
  inputCountText,
  inputHasSuffix,
  inputIsTextarea,
  inputNativeType,
  inputRedirectFocus,
  inputShowClear,
  inputShowEye,
  inputStyle,
  inputText,
  INPUT_CLEAR_LABEL,
  INPUT_PASSWORD_HIDE_LABEL,
  INPUT_PASSWORD_SHOW_LABEL,
  type InputExpose,
  type InputProps as CoreInputProps,
} from "@shuimo-design/core";
import { IconClose, IconEye, IconEyeOff } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useDisabled, useFormItem } from "../../internal/form-item";

/**
 * 没被组件用掉的属性原样落到原生元素上，对应 Vue 那边的 inheritAttrs: false + v-bind="nativeAttrs"。
 * 取 input 与 textarea 两套属性的交集类型：同一份对象要能展进两种标签，
 * 事件处理器在交集里也是"两种元素都收得下"的那一版。
 */
type NativeAttrs = Omit<
  ComponentPropsWithoutRef<"input"> & ComponentPropsWithoutRef<"textarea">,
  | "autoComplete"
  | "autoFocus"
  | "children"
  | "className"
  | "defaultValue"
  | "disabled"
  | "maxLength"
  | "name"
  | "onBlur"
  | "onChange"
  | "onFocus"
  | "onInput"
  | "onKeyDown"
  | "placeholder"
  | "prefix"
  | "readOnly"
  | "rows"
  | "size"
  | "style"
  | "type"
  | "value"
>;

export interface MInputProps extends CoreInputProps, NativeAttrs {
  /** 受控值；不传就由组件自己记（配合 defaultValue） */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 每次输入 */
  onInput?: (value: string) => void;
  /** 值提交（对应原生 change：失焦或回车，且值确实变过） */
  onChange?: (value: string) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  /** 点了清空按钮 */
  onClear?: () => void;
  /** 输入框前的内容（图标、单位） */
  prefix?: ReactNode;
  /** 输入框后的内容 */
  suffix?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const MInput = forwardRef<InputExpose, MInputProps>(function MInput(props, ref) {
  const {
    type = "text",
    placeholder,
    disabled: disabledProp = false,
    readonly = false,
    clearable = false,
    showPassword = false,
    maxlength,
    showCount = false,
    rows = 3,
    resize = "vertical",
    name,
    autocomplete,
    autofocus = false,
    value,
    defaultValue,
    onValueChange,
    onInput,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onClear,
    prefix,
    suffix,
    className,
    style,
    ...nativeAttrs
  } = props;

  // 上下文形状在 core（context/form-item.ts），这两行只是 React 的 useContext 胶水
  const formItem = useFormItem();
  const disabled = useDisabled(disabledProp);

  // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const model = isControlled ? value : uncontrolled;

  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const native = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const text = inputText(model);
  const isTextarea = inputIsTextarea(type);
  const showClear = inputShowClear({ clearable, disabled, readonly, text });
  const showEye = inputShowEye({ type, showPassword, disabled });
  const hasSuffix = inputHasSuffix({
    showClear,
    showEye,
    hasSuffixSlot: suffix !== undefined && suffix !== null,
    showCount,
    isTextarea,
  });
  const countText = inputCountText(inputCount(text), maxlength);

  // 水墨皮肤：外框换成一笔细笔触（参数与其他表单控件共用），聚焦 / 禁用只换墨色（见 input.css 的 m.ink 层）
  const root = useBrushBorder(inputBrush());

  function setModel(next: string) {
    if (!isControlled) setUncontrolled(next);
    onValueChange?.(next);
  }

  /**
   * React 只有"每次按键"的 onChange，没有原生那个"提交时才发"的 change 事件，
   * 所以自己记一笔上次提交过的值：失焦 / 回车时值确实变过才发 onChange，
   * 和 Vue 那边直接监听原生 change 的行为对齐。
   */
  const committed = useRef(text);
  function commit(next: string) {
    if (committed.current === next) return;
    committed.current = next;
    onChange?.(next);
    formItem.validate("change");
  }

  function handleInput(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const next = event.currentTarget.value;
    setModel(next);
    onInput?.(next);
  }

  function handleFocus(event: FocusEvent<HTMLElement>) {
    setFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    setFocused(false);
    commit(native.current?.value ?? text);
    onBlur?.(event);
    formItem.validate("blur");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.key === "Enter") commit(native.current?.value ?? text);
  }

  function clear() {
    setModel("");
    onInput?.("");
    committed.current = "";
    onChange?.("");
    onClear?.();
    formItem.validate("change");
    native.current?.focus();
  }

  /** 点在外框空白处也把焦点送进输入框，和点在文字上一样 */
  function onRootMouseDown(event: MouseEvent<HTMLElement>) {
    const redirect = inputRedirectFocus({
      target: event.target as HTMLElement | null,
      native: native.current,
      disabled,
    });
    if (!redirect) return;
    event.preventDefault();
    native.current?.focus();
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

  useEffect(() => {
    if (autofocus) native.current?.focus();
    // 只在挂载时自动聚焦一次，和 Vue 的 onMounted 对齐
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = inputClasses({
    type,
    disabled,
    readonly,
    focused,
    isTextarea,
    hasPrefix: prefix !== undefined && prefix !== null,
    hasSuffix,
    showCount,
  });

  const shared = {
    ...nativeAttrs,
    ref: native,
    id: formItem.id,
    className: "m-input__native",
    value: text,
    placeholder,
    disabled,
    readOnly: readonly,
    maxLength: maxlength,
    name,
    autoComplete: autocomplete,
    onChange: handleInput,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  const count = (
    <span className="m-input__count" aria-live="polite">
      {countText}
    </span>
  );

  return (
    <div
      ref={root}
      className={[...classes, className].filter(Boolean).join(" ")}
      style={{ ...inputStyle(resize), ...style } as CSSProperties}
      onMouseDown={onRootMouseDown}
    >
      {prefix ? <span className="m-input__prefix">{prefix}</span> : null}
      {isTextarea ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={inputNativeType(type, passwordVisible)} />
      )}
      {hasSuffix ? (
        <span className="m-input__suffix">
          {showClear ? (
            <button
              type="button"
              className="m-input__action"
              aria-label={INPUT_CLEAR_LABEL}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
            >
              <IconClose />
            </button>
          ) : null}
          {showEye ? (
            <button
              type="button"
              className="m-input__action"
              aria-label={passwordVisible ? INPUT_PASSWORD_HIDE_LABEL : INPUT_PASSWORD_SHOW_LABEL}
              aria-pressed={passwordVisible}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? <IconEyeOff /> : <IconEye />}
            </button>
          ) : null}
          {suffix}
          {showCount && !isTextarea ? count : null}
        </span>
      ) : null}
      {/* 多行时字数落在右下角，不占一行 */}
      {showCount && isTextarea ? count : null}
    </div>
  );
});
