import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import {
  gridClasses,
  gridStyle,
  resolveGridCells,
  type GridCellConfig,
  type GridProps as CoreGridProps,
} from "@shuimo-design/core";
import { MCell, type MCellProps } from "./MCell";

/** React 这边的一个格子：content 就是普通的 ReactNode */
export type ReactGridCell = GridCellConfig<ReactNode>;

export interface MGridProps extends Omit<CoreGridProps, "cells"> {
  /** 每个格子的配置，顺序就是排列顺序；不传则按书写顺序从子组件 MCell 上收集 */
  cells?: ReactGridCell[];
  /** 放 MCell（语法糖；传了 cells 就不看这里） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 从 children 里按**书写顺序**收集 MCell 的配置。
 *
 * 顺序在这里格外要紧：gapRotate 的第 i 道斜缝正好是第 i 个格子的右边、第 i+1 个格子的左边。
 * 读元素上的 props 是渲染期就完成的，不用等 effect，也不比 DOM 位置。
 */
function collectCells(children: ReactNode): ReactGridCell[] {
  const cells: ReactGridCell[] = [];
  for (const node of Children.toArray(children)) {
    if (!isValidElement(node) || node.type !== MCell) continue;
    const props = node.props as MCellProps;
    cells.push({
      key: node.key ?? undefined,
      w: props.w,
      h: props.h,
      border: props.border ?? false,
      points: props.points,
      a: props.a,
      b: props.b,
      c: props.c,
      d: props.d,
      span: props.span,
      offset: props.offset,
      content: props.children,
    });
  }
  return cells;
}

export function MGrid(props: MGridProps) {
  const { w, h, gap, colGap, rowGap, gapRotate, direction = "row", cols, children } = props;

  // 格子的来源：传了 cells 就用传的，没传才从 children 收集
  const cells = resolveGridCells(props.cells ?? collectCells(children), {
    w,
    h,
    direction,
    cols,
    gapRotate,
  });

  return (
    <div
      className={[...gridClasses({ direction, cols }), props.className].filter(Boolean).join(" ")}
      style={
        {
          ...gridStyle({ w, h, gap, colGap, rowGap, gapRotate, direction, cols }),
          ...props.style,
        } as CSSProperties
      }
    >
      {cells.map((cell) => (
        <MCell key={cell.key} {...cell.props}>
          {cell.content}
        </MCell>
      ))}
    </div>
  );
}
