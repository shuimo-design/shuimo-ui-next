import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  collapseActiveNames,
  collapseClasses,
  collapseNextModel,
  type CollapseContextValue,
  type CollapseModel,
  type CollapseName,
  type CollapseProps as CoreCollapseProps,
} from "@shuimo-design/core";
import { CollapseContext } from "./context";

/** Accordion 从 accordion 属性推，Name 从 value / onValueChange 推，和 core 的 CollapseModel 一致 */
export interface MCollapseProps<
  Accordion extends boolean = boolean,
  Name extends CollapseName = CollapseName,
> extends CoreCollapseProps<Accordion> {
  /**
   * 受控的展开项；不传就由组件自己记（配合 defaultValue）。
   * 手风琴下是单个 name（全收起是 undefined），否则是 name 数组。
   */
  value?: CollapseModel<Accordion, Name>;
  defaultValue?: CollapseModel<Accordion, Name>;
  onValueChange?: (value: CollapseModel<Accordion, Name>) => void;
  /** 展开项变化 */
  onChange?: (value: CollapseModel<Accordion, Name>) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MCollapse<
  Accordion extends boolean = false,
  Name extends CollapseName = CollapseName,
>(props: MCollapseProps<Accordion, Name>) {
  const { accordion = false as Accordion, divider = true, disabled = false, children } = props;

  // 受控 / 非受控两种都支持：传了 value 就听外面的，没传就自己记一份
  const isControlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<CollapseModel<Accordion, Name> | undefined>(
    props.defaultValue,
  );
  const model = isControlled ? props.value : uncontrolled;

  // toggle 要放进上下文，身份必须稳定（变一次所有子项白重渲染一轮），
  // 但它又得读到最新的值和回调 —— 所以最新的那份挂在 ref 上，闭包里不捕获
  const latest = useRef({ model, isControlled, accordion, props });
  latest.current = { model, isControlled, accordion, props };

  const toggle = useCallback((name: Parameters<CollapseContextValue["toggle"]>[0]) => {
    const current = latest.current;
    // 增删规则（含手风琴只留一项）在 core，和 Vue 那边是同一份；
    // core 算出来的是两种形状的并集，按本组件的 Accordion / Name 收窄一次
    const next = collapseNextModel(current.model, name, current.accordion) as CollapseModel<
      Accordion,
      Name
    >;
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
