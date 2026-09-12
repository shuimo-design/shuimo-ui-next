import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  collapseActiveNames,
  collapseClasses,
  collapseNextModel,
  type CollapseContextValue,
  type CollapseModel,
  type CollapseProps as CoreCollapseProps,
} from "@shuimo-design/core";
import { CollapseContext } from "./context";

export interface MCollapseProps extends CoreCollapseProps {
  /**
   * 受控的展开项；不传就由组件自己记（配合 defaultValue）。
   * 手风琴下是单个 name（全收起是 undefined），否则是 name 数组。
   */
  value?: CollapseModel;
  defaultValue?: CollapseModel;
  onValueChange?: (value: CollapseModel) => void;
  /** 展开项变化 */
  onChange?: (value: CollapseModel) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MCollapse(props: MCollapseProps) {
  const { accordion = false, divider = true, disabled = false, children } = props;

  // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
  const isControlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<CollapseModel>(props.defaultValue);
  const model = isControlled ? props.value : uncontrolled;

  // toggle 要放进上下文，身份必须稳定（变一次所有子项白重渲染一轮），
  // 但它又得读到最新的值和回调 —— 所以最新的那份挂在 ref 上，闭包里不捕获
  const latest = useRef({ model, isControlled, accordion, props });
  latest.current = { model, isControlled, accordion, props };

  const toggle = useCallback((name: Parameters<CollapseContextValue["toggle"]>[0]) => {
    const current = latest.current;
    // 增删规则（含手风琴只留一项）在 core，和 Vue 那边是同一份
    const next = collapseNextModel(current.model, name, current.accordion);
    if (!current.isControlled) setUncontrolled(next);
    current.props.onValueChange?.(next);
    current.props.onChange?.(next);
  }, []);

  const active = useMemo(() => collapseActiveNames(model), [model]);
  const context = useMemo<CollapseContextValue>(
    () => ({ active, divider, disabled, toggle }),
    [active, divider, disabled, toggle],
  );

  return (
    <CollapseContext value={context}>
      <div
        className={[...collapseClasses({ disabled }), props.className].filter(Boolean).join(" ")}
        style={props.style}
      >
        {children}
      </div>
    </CollapseContext>
  );
}
