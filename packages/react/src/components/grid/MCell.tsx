import { useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  cellBrush,
  cellBrushEnabled,
  cellGeometry,
  createCellShift,
  type CellComponentProps,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";
import { useController, useMounted, useSize } from "../../runtime";

export interface MCellProps extends CellComponentProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 一个格子。既能单独用，也能放进 MGrid 当语法糖 ——
 * 放进 MGrid 时它不会被渲染，MGrid 只在渲染期读它的 props 拼成 `cells` 配置，再自己画一遍。
 */
export function MCell(props: MCellProps) {
  const [sizeRef, size] = useSize();
  /** 挂载后才敢读引擎状态；服务端和水合首帧一律当作没开，两边输出才对得上 */
  const mounted = useMounted();

  // 往左压多少交给 core 的控制器：它会把这一次布局改动推到下一帧，不在尺寸回调里同步改
  const [shift, shiftState] = useController(createCellShift, {
    height: size.height,
    angle: props.shiftAngle,
  });
  useEffect(() => shift.flush());

  const geometry = cellGeometry({
    props,
    width: size.width,
    height: size.height,
    shift: shiftState.shift,
    mounted,
  });

  // 直边格子的笔触边框；斜边格子换成 cellGeometry 里按角点生成的笔触多边形遮罩
  const brushRef = useBrushBorder({
    ...cellBrush(),
    enabled: cellBrushEnabled(props.border, geometry.tilted),
  });
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      sizeRef(el);
      brushRef(el);
    },
    [sizeRef, brushRef],
  );

  return (
    <div
      ref={rootRef}
      className={[...geometry.classes, props.className].filter(Boolean).join(" ")}
      style={{ ...geometry.style, ...props.style } as CSSProperties}
    >
      <div
        className="m-cell__main"
        style={geometry.clipPath ? { clipPath: geometry.clipPath } : undefined}
      >
        {props.children}
      </div>
      {/* 斜边格子默认皮肤的细线轮廓；水墨模式换成 ::before 上的笔触多边形遮罩 */}
      {geometry.outlinePoints ? (
        <svg className="m-cell__outline" aria-hidden="true">
          <polygon points={geometry.outlinePoints} />
        </svg>
      ) : null}
    </div>
  );
}
