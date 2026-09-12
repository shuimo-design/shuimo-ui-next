import type { ReactNode } from "react";
import type { TableAlign, TableCellScope, TableHeadScope, TableRow } from "@shuimo-design/core";

export interface MTableColumnProps<Row = TableRow> {
  /** 列对应的字段名，取值 row[prop] */
  prop: string;
  /** 列名；renderHead 优先 */
  label?: string;
  /** 列宽，数字按 px；不传按内容自动分配 */
  width?: string | number;
  /** 对齐，默认跟随表格的 align */
  align?: TableAlign;
  /** 自定义单元格；不给就直出 row[prop] */
  render?: (scope: TableCellScope<Row>) => ReactNode;
  /** 自定义表头；不给就直出 label */
  renderHead?: (scope: TableHeadScope<Row>) => ReactNode;
}

/**
 * 标记组件：自己一个节点都不渲染，永远返回 null。
 *
 * MTable 在**渲染期**用 `Children.toArray` 按书写顺序读这里的 props，拼成和 `columns` 属性
 * 一模一样的配置数组 —— 不等挂载、不碰 DOM，所以服务端渲染的列序就是对的。
 * 等价的写法是给 MTable 传 `columns`。
 */
export function MTableColumn<Row = TableRow>(_props: MTableColumnProps<Row>): null {
  return null;
}
