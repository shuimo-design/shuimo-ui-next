import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  nextTableSort,
  resolveTableColumns,
  sortTableRows,
  TABLE_SELECT_ALL_LABEL,
  TABLE_SELECTION_CELL_CLASS,
  TABLE_SELECTION_HEAD_CLASS,
  TABLE_SELECTION_LABEL,
  tableCellScope,
  tableCellText,
  tableCellValue,
  tableClasses,
  tableGridTemplate,
  tableHeadScope,
  tableInk,
  tableRowClasses,
  tableRowId,
  tableSelectedRows,
  tableSelectionState,
  tableSortAria,
  tableSortClasses,
  tableSortInk,
  tableSortOrder,
  toggleAllTableSelection,
  toggleTableSelection,
  type TableColumnConfig,
  type TableProps as CoreTableProps,
  type TableRow,
  type TableRowKeyValue,
  type TableSort,
} from "@shuimo-design/core";
import { IconCaretDown, IconCaretUp } from "../../icons";
import { useMounted, useSize } from "../../runtime";
import { MCheckbox } from "../checkbox";
import { MTableColumn, type MTableColumnProps } from "./MTableColumn";

/** React 这边的一列：render / renderHead 返回 ReactNode */
export type ReactTableColumn<Row = TableRow> = TableColumnConfig<Row, ReactNode>;

export interface MTableProps<Row extends object = TableRow> extends Omit<
  CoreTableProps<Row>,
  "columns"
> {
  /** 列声明，顺序就是列序；不传则按书写顺序从子组件 MTableColumn 上收集 */
  columns?: ReactTableColumn<Row>[];
  /** 受控的排序，null 是不排；不传就由组件自己记（配合 defaultSort） */
  sort?: TableSort | null;
  /** 排序变化；null 是取消排序 */
  onSortChange?: (sort: TableSort | null) => void;
  /** 受控的选中行 key；不传就由组件自己记（配合 defaultSelectedKeys） */
  selectedKeys?: TableRowKeyValue[];
  defaultSelectedKeys?: TableRowKeyValue[];
  onSelectedKeysChange?: (keys: TableRowKeyValue[]) => void;
  /** 选中集合变化，带上变化后的全部 key 和当前数据里对应的行 */
  onSelectionChange?: (keys: TableRowKeyValue[], rows: Row[]) => void;
  /** 勾选 / 取消某一行 */
  onSelect?: (row: Row, selected: boolean) => void;
  /** 表头全选 / 取消全选 */
  onSelectAll?: (selected: boolean) => void;
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
      sortable: props.sortable,
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
    sortRemote = false,
    selection = false,
    selectable,
  } = props;

  // 列的来源：传了 columns 就用传的，没传才从 children 收集
  const rawColumns = props.columns ?? collectColumns<Row>(children);
  const columns = resolveTableColumns(rawColumns, align);

  /* ---------- 排序：受控 / 非受控都支持 ---------- */
  const sortControlled = props.sort !== undefined;
  const [ownSort, setOwnSort] = useState<TableSort | null>(props.defaultSort ?? null);
  const sort = sortControlled ? props.sort! : ownSort;
  const sortInk = tableSortInk();

  function toggleSort(prop: string) {
    const next = nextTableSort(sort, prop);
    if (!sortControlled) setOwnSort(next);
    props.onSortChange?.(next);
  }

  /* ---------- 行选择：受控 / 非受控都支持，纯函数在 core ---------- */
  const keysControlled = props.selectedKeys !== undefined;
  const [ownKeys, setOwnKeys] = useState<TableRowKeyValue[]>(props.defaultSelectedKeys ?? []);
  const selectedKeys = keysControlled ? props.selectedKeys! : ownKeys;
  const selectionState = tableSelectionState(selectedKeys, data, rowKey, selectable);

  function commitSelection(keys: TableRowKeyValue[]) {
    if (!keysControlled) setOwnKeys(keys);
    props.onSelectedKeysChange?.(keys);
    props.onSelectionChange?.(keys, tableSelectedRows(keys, data, rowKey));
  }

  function toggleRow(row: Row, index: number, selected: boolean) {
    const key = tableRowId(row, index, rowKey);
    commitSelection(toggleTableSelection(selectedKeys, key, selected, selection));
    props.onSelect?.(row, selected);
  }

  function toggleAll(selected: boolean) {
    commitSelection(toggleAllTableSelection(selectedKeys, data, rowKey, selectable, selected));
    props.onSelectAll?.(selected);
  }

  /** 排好序的行，key 和选中态一并算好；sortRemote 时不在本地排，行序交给服务端 */
  const localSort = sortRemote ? null : sort;
  const rows = useMemo(() => {
    const selected = new Set(selectedKeys);
    return sortTableRows(data, localSort, rawColumns).map(({ row, index }) => {
      const key = tableRowId(row, index, rowKey);
      return {
        row,
        index,
        key,
        selected: selected.has(key),
        disabled: selectable ? !selectable(row, index) : false,
      };
    });
  }, [data, localSort, rawColumns, rowKey, selectable, selectedKeys]);

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
          style={{ gridTemplateColumns: tableGridTemplate(columns, selection) }}
        >
          <thead className="m-table__head">
            <tr className="m-table__row m-table__row--head" role="row">
              {selection ? (
                <th
                  className={TABLE_SELECTION_HEAD_CLASS}
                  role="columnheader"
                  scope="col"
                  aria-label={
                    selection === "multiple" ? TABLE_SELECT_ALL_LABEL : TABLE_SELECTION_LABEL
                  }
                >
                  {/* 单选没有"全选"这回事，表头只留个空位 */}
                  {selection === "multiple" ? (
                    <MCheckbox
                      checked={selectionState.all}
                      indeterminate={selectionState.some}
                      disabled={selectionState.total === 0}
                      onCheckedChange={toggleAll}
                    />
                  ) : null}
                </th>
              ) : null}
              {columns.map((col) => {
                const head = col.column.renderHead
                  ? col.column.renderHead(tableHeadScope(col.column))
                  : col.label;
                return (
                  <th
                    key={col.key}
                    className={col.headClass}
                    role="columnheader"
                    scope="col"
                    data-prop={col.prop}
                    aria-sort={col.sortable ? tableSortAria(sort, col.prop) : undefined}
                  >
                    {/* 可排序的列：整个表头文字是一个真按钮，键盘也能点；三态循环在 core */}
                    {col.sortable ? (
                      <button
                        type="button"
                        className={tableSortClasses(tableSortOrder(sort, col.prop)).join(" ")}
                        style={sortInk as CSSProperties}
                        onClick={() => toggleSort(col.prop)}
                      >
                        {head}
                        <span className="m-table__sort-icons" aria-hidden="true">
                          <span className="m-table__sort-icon m-table__sort-icon--ascending">
                            <IconCaretUp />
                          </span>
                          <span className="m-table__sort-icon m-table__sort-icon--descending">
                            <IconCaretDown />
                          </span>
                        </span>
                      </button>
                    ) : (
                      head
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="m-table__body">
            {rows.length > 0 ? (
              rows.map(({ row, index, key, selected, disabled }) => (
                <tr
                  key={key}
                  className={tableRowClasses({ selected }).join(" ")}
                  role="row"
                  aria-selected={selection ? selected : undefined}
                  onClick={(event) => props.onRowClick?.(row, index, event)}
                >
                  {selection ? (
                    <td className={TABLE_SELECTION_CELL_CLASS} role="cell">
                      {/* 点勾选框只改选中态，不算点行；拦住冒泡 */}
                      <MCheckbox
                        checked={selected}
                        disabled={disabled}
                        onClick={(event: MouseEvent<HTMLLabelElement>) => event.stopPropagation()}
                        onCheckedChange={(value) => toggleRow(row, index, value)}
                      />
                    </td>
                  ) : null}
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
                <td
                  className="m-table__empty"
                  role="cell"
                  aria-colspan={columns.length + (selection ? 1 : 0) || 1}
                >
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
