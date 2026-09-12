import {
  Children,
  isValidElement,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  resolveTableColumns,
  tableCellScope,
  tableCellText,
  tableCellValue,
  tableClasses,
  tableGridTemplate,
  tableHeadScope,
  tableInk,
  tableRowId,
  type TableColumnConfig,
  type TableProps as CoreTableProps,
  type TableRow,
} from "@shuimo-design/core";
import { useMounted, useSize } from "../../runtime";
import { MTableColumn, type MTableColumnProps } from "./MTableColumn";

/** React 这边的一列：render / renderHead 返回 ReactNode */
export type ReactTableColumn<Row = TableRow> = TableColumnConfig<Row, ReactNode>;

export interface MTableProps<Row extends object = TableRow> extends Omit<
  CoreTableProps<Row>,
  "columns"
> {
  /** 列声明，顺序就是列序；不传则按书写顺序从子组件 MTableColumn 上收集 */
  columns?: ReactTableColumn<Row>[];
  /** 点击某一行 */
  onRowClick?: (row: Row, index: number, event: MouseEvent) => void;
  /** 没有数据时显示的内容，优先于 emptyText */
  empty?: ReactNode;
  /** 放 MTableColumn（语法糖；传了 columns 就不看这里） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 从 children 里按**书写顺序**收集 MTableColumn 的配置。
 *
 * 全程在渲染期完成：读的是元素上的 props。effect 的执行顺序在 Fragment / Suspense /
 * 并发切片下不保证跟 DOM 一致，服务端更是没有 DOM —— 所以列序不能靠子组件登记。
 */
function collectColumns<Row>(children: ReactNode): ReactTableColumn<Row>[] {
  const columns: ReactTableColumn<Row>[] = [];
  for (const node of Children.toArray(children)) {
    if (!isValidElement(node) || node.type !== MTableColumn) continue;
    const props = node.props as MTableColumnProps<Row>;
    columns.push({
      prop: props.prop,
      label: props.label,
      width: props.width,
      align: props.align,
      render: props.render,
      renderHead: props.renderHead,
    });
  }
  return columns;
}

export function MTable<Row extends object = TableRow>(props: MTableProps<Row>) {
  const {
    data = [],
    rowKey,
    height,
    align = "center",
    stripe = false,
    emptyText = "暂无数据",
    empty,
    children,
  } = props;

  // 列的来源：传了 columns 就用传的，没传才从 children 收集
  const columns = resolveTableColumns(props.columns ?? collectColumns<Row>(children), align);

  // ---- 墨线：按表格实际宽度生成，宽度按 32px 分桶。首帧量到 0，渲染朴素版 ----
  const [rootRef, size] = useSize();
  const mounted = useMounted();
  const ink = tableInk({ width: size.width, mounted });

  return (
    <div
      ref={rootRef}
      className={[...tableClasses({ stripe, height }), props.className].filter(Boolean).join(" ")}
      style={{ ...ink.style, ...props.style } as CSSProperties}
      {...ink.attrs}
    >
      <div className="m-table__scroll" style={{ maxHeight: height }}>
        <table
          className="m-table__inner"
          role="table"
          style={{ gridTemplateColumns: tableGridTemplate(columns) }}
        >
          <thead className="m-table__head">
            <tr className="m-table__row m-table__row--head" role="row">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.headClass}
                  role="columnheader"
                  scope="col"
                  data-prop={col.prop}
                >
                  {col.column.renderHead
                    ? col.column.renderHead(tableHeadScope(col.column))
                    : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="m-table__body">
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={tableRowId(row, index, rowKey)}
                  className="m-table__row m-table__row--body"
                  role="row"
                  onClick={(event) => props.onRowClick?.(row, index, event)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.cellClass} role="cell" data-prop={col.prop}>
                      {col.column.render
                        ? col.column.render(tableCellScope(row, index, col.column))
                        : tableCellText(tableCellValue(row, col.prop))}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="m-table__row m-table__row--empty" role="row">
                <td className="m-table__empty" role="cell" aria-colspan={columns.length || 1}>
                  {empty ?? emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
