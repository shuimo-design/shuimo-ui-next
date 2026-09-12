import { createElement, type CSSProperties, type ReactNode } from "react";
import {
  svgClasses,
  svgInkKind,
  svgStyle,
  type SvgProps as CoreSvgProps,
} from "@shuimo-design/core";
import { SVG_ICONS } from "./icons";

export interface MSvgProps extends CoreSvgProps {
  /** 自定义 svg 内容，name 没传时渲染 */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MSvg(props: MSvgProps) {
  const { name, ink = false, seed = 1, size, color, rotate = 0, spin = false, title } = props;
  const inkKind = svgInkKind({ name, ink });
  // 名字 → 线性图标组件的那张表值是 React 组件，下沉不了，两个壳各有一份
  const icon = name ? SVG_ICONS[name] : undefined;

  return (
    <span
      className={[...svgClasses({ spin, inkKind }), props.className].filter(Boolean).join(" ")}
      style={
        { ...svgStyle({ size, color, rotate, seed, inkKind }), ...props.style } as CSSProperties
      }
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
    >
      {inkKind ? <span className="m-svg__ink" /> : icon ? createElement(icon) : props.children}
    </span>
  );
}
