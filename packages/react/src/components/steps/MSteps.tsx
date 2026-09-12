import { Children, isValidElement, useMemo, type CSSProperties, type ReactNode } from "react";
import { stepsClasses, type StepsContextValue, type StepsProps } from "@shuimo-design/core";
import { StepIndexContext, StepsContext } from "./context";

export interface MStepsProps extends StepsProps {
  /** 放 MStep */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MSteps(props: MStepsProps) {
  const {
    active = 0,
    direction = "horizontal",
    status = "process",
    simple = false,
    children,
  } = props;

  // 整组配置一份发给所有步；内容没变就不换引用，免得每次渲染把所有步叫醒
  const group = useMemo<StepsContextValue>(
    () => ({ active, direction, status, simple }),
    [active, direction, status, simple],
  );

  /**
   * 序号由 children 的顺序决定，不让每一步登记：
   * 登记表的顺序取决于 effect 的执行时机，React 在 Fragment / Suspense / 并发切片下
   * 不保证它和 DOM 顺序一致，服务端更是压根没有 DOM。Vue 那边也是照 children 数的。
   * Children.toArray 会摊平数组、丢掉 null / false（条件渲染的那一步不占位）。
   */
  const items = Children.toArray(children);

  return (
    <div
      className={[...stepsClasses({ direction, simple }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
      role="list"
    >
      <StepsContext.Provider value={group}>
        {items.map((child, index) => (
          <StepIndexContext.Provider
            // toArray 已经给每个元素配了稳定的 key，拿来用，删掉一步时剩下的不会被当成新的
            key={isValidElement(child) ? (child.key ?? index) : index}
            value={{ index, count: items.length }}
          >
            {child}
          </StepIndexContext.Provider>
        ))}
      </StepsContext.Provider>
    </div>
  );
}
