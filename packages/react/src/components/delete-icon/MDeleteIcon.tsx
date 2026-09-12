import { createElement, type CSSProperties, type MouseEvent } from "react";
import {
  deleteIconClasses,
  deleteIconInert,
  deleteIconStyle,
  DELETE_ICON_BRUSH_SHAPES,
  DELETE_ICON_BRUSH_TRANSFORM,
  DELETE_ICON_BRUSH_VIEW_BOX,
  DELETE_ICON_LABEL,
  type DeleteIconProps as CoreDeleteIconProps,
} from "@shuimo-design/core";

export interface MDeleteIconProps extends CoreDeleteIconProps {
  /** 点了图标（禁用时不触发） */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: CSSProperties;
}

/** 几何数据里的属性名是 SVG 的写法（stroke-width / class），React 要驼峰和 className */
function toReactAttrs(attrs: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    const name =
      key === "class" ? "className" : key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[name] = value;
  }
  return out;
}

export function MDeleteIcon(props: MDeleteIconProps) {
  const {
    kind = "brush",
    size = 32,
    disabled = false,
    label = DELETE_ICON_LABEL,
    seed = 1,
  } = props;

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (deleteIconInert(props)) return;
    props.onClick?.(event);
  };

  return (
    <button
      type="button"
      className={[...deleteIconClasses(props), props.className].filter(Boolean).join(" ")}
      style={{ ...deleteIconStyle({ kind, size, seed }), ...props.style } as CSSProperties}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {kind === "brush" ? (
        // 笔的几何在 core，这里只把它画出来；转角和画幅也一起从那边来
        <svg
          className="m-delete-icon__brush"
          viewBox={DELETE_ICON_BRUSH_VIEW_BOX}
          aria-hidden="true"
        >
          <g transform={DELETE_ICON_BRUSH_TRANSFORM} fill="currentColor">
            {DELETE_ICON_BRUSH_SHAPES.map((shape, index) =>
              createElement(shape.tag, { key: index, ...toReactAttrs(shape.attrs) }),
            )}
          </g>
        </svg>
      ) : (
        <span className="m-delete-icon__cross" aria-hidden="true" />
      )}
    </button>
  );
}
