import type { CSSProperties, ElementType, ReactNode } from "react";
import {
  borderClasses,
  borderSides,
  borderStroke,
  borderStyle,
  type BorderProps as CoreBorderProps,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";

export interface MBorderProps extends CoreBorderProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MBorder(props: MBorderProps) {
  // tag 是运行时决定的标签名，JSX 里要用大写开头的变量才会当成组件而不是字面标签
  const Tag = (props.tag ?? "div") as ElementType;
  const sides = borderSides(props);
  // 笔触边框的生成、分桶、缓存全在 core 的控制器里，这里只把 ref 回调绑上去
  const ref = useBrushBorder(borderStroke(props, sides));

  return (
    <Tag
      ref={ref as never}
      className={[...borderClasses(props, sides), props.className].filter(Boolean).join(" ")}
      style={{ ...borderStyle(props), ...props.style } as CSSProperties}
    >
      {props.children}
    </Tag>
  );
}
