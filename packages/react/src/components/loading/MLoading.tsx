import type { CSSProperties, ReactNode } from "react";
import {
  loadingClasses,
  loadingDots,
  loadingLabel,
  loadingVars,
  LOADING_VIEW_BOX,
  type LoadingProps as CoreLoadingProps,
} from "@shuimo-design/core";

export interface MLoadingProps extends CoreLoadingProps {
  /** 替换默认的墨点转圈指示器（对应 Vue 的 indicator 插槽） */
  indicator?: ReactNode;
  /** 替代 text（对应 Vue 的默认插槽） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MLoading(props: MLoadingProps) {
  const { indicator, children, text } = props;
  // 墨点坐标是纯计算，放在 core；两个壳拿到的是同一串 points
  const dots = loadingDots(props);
  const hasText = Boolean(children || text);

  return (
    <div
      className={[...loadingClasses(props), props.className].filter(Boolean).join(" ")}
      style={{ ...loadingVars(props), ...props.style } as CSSProperties}
      role="status"
      aria-live="polite"
      aria-label={loadingLabel(props)}
    >
      <div className="m-loading__indicator">
        {indicator ?? (
          <svg className="m-loading__spinner" viewBox={LOADING_VIEW_BOX} aria-hidden="true">
            {dots.map((dot, i) => (
              <polygon key={i} points={dot.points} fillOpacity={dot.opacity} />
            ))}
          </svg>
        )}
      </div>
      {hasText ? <div className="m-loading__text">{children ?? text}</div> : null}
    </div>
  );
}
