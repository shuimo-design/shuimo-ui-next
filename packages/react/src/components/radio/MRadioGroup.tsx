import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  radioGroupClasses,
  type RadioGroupContextValue,
  type RadioGroupProps as CoreRadioGroupProps,
  type RadioValue,
} from "@shuimo-design/core";
import { RadioGroupContext } from "./context";

export interface MRadioGroupProps extends CoreRadioGroupProps {
  /** 受控的选中值；不传就由组件自己记（配合 defaultValue） */
  value?: RadioValue;
  defaultValue?: RadioValue;
  onValueChange?: (value: RadioValue) => void;
  /** 用户操作导致选中项变化 */
  onChange?: (value: RadioValue) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MRadioGroup(props: MRadioGroupProps) {
  const { disabled = false, direction = "horizontal", name, children } = props;

  // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
  const isControlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<RadioValue | undefined>(props.defaultValue);
  const value = isControlled ? props.value : uncontrolled;

  // 同一组原生 radio 必须共用 name，方向键才会在组内切换；useId 在 SSR 两端一致，不会水合不匹配
  const generatedName = useId();

  // select 要放进上下文，身份必须稳定（变一次所有子项白重渲染一轮），
  // 但它又得读到最新的值和回调 —— 所以最新的那份挂在 ref 上，闭包里不捕获
  const latest = useRef({ value, isControlled, props });
  latest.current = { value, isControlled, props };

  const select = useCallback((next: RadioValue) => {
    const current = latest.current;
    if (current.value === next) return;
    if (!current.isControlled) setUncontrolled(next);
    current.props.onValueChange?.(next);
    current.props.onChange?.(next);
  }, []);

  const context = useMemo<RadioGroupContextValue>(
    () => ({ value, disabled, name: name ?? generatedName, select }),
    [value, disabled, name, generatedName, select],
  );

  return (
    <RadioGroupContext value={context}>
      <div
        className={[...radioGroupClasses({ direction }), props.className].filter(Boolean).join(" ")}
        style={props.style}
        role="radiogroup"
      >
        {children}
      </div>
    </RadioGroupContext>
  );
}
