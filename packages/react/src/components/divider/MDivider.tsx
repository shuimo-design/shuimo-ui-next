import type { CSSProperties, ReactNode } from "react";
import {
  dividerClasses,
  dividerLineOptions,
  dividerOrientation,
  dividerStyle,
  type DividerProps as CoreDividerProps,
} from "@shuimo-design/core";
import { useBrushLine } from "./use-brush-line";

export interface MDividerProps extends CoreDividerProps {
  /** 线中间的内容，优先于 text */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MDivider(props: MDividerProps) {
  const { vertical = false, text, align = "center", children } = props;
  // 和 Vue 那边的 `Boolean(slots.default || text)` 对齐：空串不算有文字
  const hasText = Boolean(children || text);

  // 有文字时是两段线，各自量长度、各自生成；尾段的种子在 core 里错开，免得左右两笔的飞白对称。
  // hook 的数量不能随 hasText 变，所以两段线的 hook 一律都调，尾段没渲染时 ref 拿到 null，控制器自己停着
  const head = useBrushLine(dividerLineOptions(props));
  const tail = useBrushLine(dividerLineOptions(props, true));

  return (
    <div
      className={[...dividerClasses({ align, vertical, hasText }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...dividerStyle(props), ...props.style } as CSSProperties}
      role="separator"
      aria-orientation={dividerOrientation(props)}
    >
      <span ref={head} className="m-divider__line m-divider__line--head" aria-hidden="true" />
      {hasText ? (
        <>
          <span className="m-divider__text">{children ?? text}</span>
          <span ref={tail} className="m-divider__line m-divider__line--tail" aria-hidden="true" />
        </>
      ) : null}
    </div>
  );
}
