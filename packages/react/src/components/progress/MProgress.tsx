import type { CSSProperties, ReactNode } from "react";
import {
  progressBarStyle,
  progressBrush,
  progressClasses,
  progressShowInfo,
  progressValue,
  progressVars,
  type ProgressProps as CoreProgressProps,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";

export interface MProgressProps extends CoreProgressProps {
  /** 替代百分比文字；传函数时能拿到 percent（对应 Vue 的作用域插槽） */
  children?: ReactNode | ((props: { percent: number }) => ReactNode);
  className?: string;
  style?: CSSProperties;
}

export function MProgress(props: MProgressProps) {
  const { children } = props;
  const brushRef = useBrushBorder(progressBrush());
  // 钳制、取整、class 派生全在 core，这里只把结果绑上去
  const state = progressValue(props);

  const info =
    children === undefined
      ? `${state.percent}%`
      : typeof children === "function"
        ? children({ percent: state.percent })
        : children;

  return (
    <div
      className={[...progressClasses(props, state.percent), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...progressVars(props), ...props.style } as CSSProperties}
      role="progressbar"
      aria-valuenow={state.clamped}
      aria-valuemin={0}
      aria-valuemax={state.max}
      aria-valuetext={`${state.percent}%`}
    >
      <div ref={brushRef} className="m-progress__track">
        <div className="m-progress__bar" style={progressBarStyle(state.percent)} />
      </div>
      {/* 文字压在条上居中：纸色字描一圈墨边，条走到字下面也看得清 */}
      {progressShowInfo(props) ? <div className="m-progress__info">{info}</div> : null}
    </div>
  );
}
