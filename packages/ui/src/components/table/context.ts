import type { InjectionKey, Ref } from "vue";
import type { TableCellScope, TableColumnDef, TableHeadScope, TableRow } from "./types";

/** MTableColumn 向 MTable 登记的一列：属性用 getter 读，保持响应 */
export interface TableColumnRegistration {
  id: string;
  /** 列组件留在 DOM 里的占位元素，用来按文档顺序排列各列 */
  el: Ref<HTMLElement | null>;
  readonly column: TableColumnDef;
  cell: () => ((scope: TableCellScope<TableRow>) => unknown) | undefined;
  head: () => ((scope: TableHeadScope) => unknown) | undefined;
}

export interface TableContext {
  register: (column: TableColumnRegistration) => void;
  unregister: (id: string) => void;
}

export const tableKey: InjectionKey<TableContext> = Symbol("m-table");
