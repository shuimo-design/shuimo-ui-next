import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  checkboxGroupClasses,
  nextCheckboxValues,
  type CheckboxGroupContextValue,
  type CheckboxGroupProps as CoreCheckboxGroupProps,
  type CheckboxValue,
} from "@shuimo-design/core";
import { CheckboxGroupContext } from "./context";

export interface MCheckboxGroupProps extends CoreCheckboxGroupProps {
  /** 受控的已选值；不传就由组件自己记（配合 defaultValue） */
  value?: CheckboxValue[];
  defaultValue?: CheckboxValue[];
  onValueChange?: (values: CheckboxValue[]) => void;
  /** 用户操作导致已选值变化 */
  onChange?: (values: CheckboxValue[]) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MCheckboxGroup(props: MCheckboxGroupProps) {
  const { disabled = false, min, max, direction = "horizontal", children } = props;

  // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
  const isControlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<CheckboxValue[]>(props.defaultValue ?? []);
  const values = isControlled ? props.value! : uncontrolled;

  // toggle 要放进上下文，身份必须稳定（变一次所有子项白重渲染一轮），
  // 但它又得读到最新的值和回调 —— 所以最新的那份挂在 ref 上，闭包里不捕获
  const latest = useRef({ values, isControlled, props });
  latest.current = { values, isControlled, props };

  const toggle = useCallback((value: CheckboxValue, checked: boolean) => {
    const current = latest.current;
    // 增删规则在 core，和 Vue 那边是同一份
    const next = nextCheckboxValues(current.values, value, checked);
    if (!current.isControlled) setUncontrolled(next);
    current.props.onValueChange?.(next);
    current.props.onChange?.(next);
  }, []);

  const context = useMemo<CheckboxGroupContextValue>(
    () => ({ values, disabled, min, max, toggle }),
    [values, disabled, min, max, toggle],
  );

  return (
    <CheckboxGroupContext value={context}>
      <div
        className={[...checkboxGroupClasses({ direction }), props.className]
          .filter(Boolean)
          .join(" ")}
        style={props.style}
        role="group"
      >
        {children}
      </div>
    </CheckboxGroupContext>
  );
}
