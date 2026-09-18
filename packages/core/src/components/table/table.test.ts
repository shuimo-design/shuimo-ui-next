import { describe, expect, it } from "vitest";
import {
  compareTableValues,
  nextTableSort,
  resolveTableColumns,
  sortTableRows,
  tableGridTemplate,
  tableRowClasses,
  tableSelectedRows,
  tableColumnSortable,
  tableSelectionState,
  tableSortAria,
  tableSortClasses,
  toggleAllTableSelection,
  toggleTableSelection,
  type TableColumnConfig,
} from ".";

interface Term {
  id: number;
  name: string;
  order: number | null;
}

const terms: Term[] = [
  { id: 1, name: "立春", order: 3 },
  { id: 2, name: "雨水", order: null },
  { id: 3, name: "惊蛰", order: 1 },
  { id: 4, name: "春分", order: 2 },
];

const columns: TableColumnConfig<Term>[] = [
  { prop: "id", sortable: true },
  { prop: "name" },
  { prop: "order", sortable: true },
  { prop: "custom", sortable: (a, b) => a.name.length - b.name.length },
];

describe("compareTableValues", () => {
  it("compares numbers by value, strings by locale and puts empty values last", () => {
    expect(compareTableValues(2, 10)).toBeLessThan(0);
    expect(compareTableValues("b", "a")).toBeGreaterThan(0);
    expect(compareTableValues("a", "a")).toBe(0);
    expect(compareTableValues(null, 1)).toBeGreaterThan(0);
    expect(compareTableValues(1, undefined)).toBeLessThan(0);
    expect(compareTableValues(null, undefined)).toBe(0);
    // 数字和字符串混着走字符串比较，不抛
    expect(compareTableValues(2, "10")).toBeGreaterThan(0);
  });
});

describe("nextTableSort", () => {
  it("cycles none → ascending → descending → none and restarts on another column", () => {
    expect(nextTableSort(null, "id")).toEqual({ prop: "id", order: "ascending" });
    expect(nextTableSort({ prop: "id", order: "ascending" }, "id")).toEqual({
      prop: "id",
      order: "descending",
    });
    expect(nextTableSort({ prop: "id", order: "descending" }, "id")).toBeNull();
    expect(nextTableSort({ prop: "id", order: "descending" }, "name")).toEqual({
      prop: "name",
      order: "ascending",
    });
  });

  it("derives aria-sort and the button classes", () => {
    const sort = { prop: "id", order: "descending" } as const;
    expect(tableSortAria(sort, "id")).toBe("descending");
    expect(tableSortAria(sort, "name")).toBe("none");
    expect(tableSortAria(null, "name")).toBe("none");
    expect(tableSortClasses("ascending")).toEqual(["m-table__sort", "m-table__sort--ascending"]);
    expect(tableSortClasses(null)).toEqual(["m-table__sort"]);
  });
});

describe("sortTableRows", () => {
  it("keeps the data order (with original indexes) when there is no sort", () => {
    const rows = sortTableRows(terms, null, columns);
    expect(rows.map((r) => r.index)).toEqual([0, 1, 2, 3]);
    expect(rows[0]!.row).toBe(terms[0]);
  });

  it("sorts by the default comparator both ways, empty values last, and keeps original indexes", () => {
    const asc = sortTableRows(terms, { prop: "order", order: "ascending" }, columns);
    expect(asc.map((r) => r.row.id)).toEqual([3, 4, 1, 2]);
    expect(asc.map((r) => r.index)).toEqual([2, 3, 0, 1]);
    const desc = sortTableRows(terms, { prop: "order", order: "descending" }, columns);
    expect(desc.map((r) => r.row.id)).toEqual([2, 1, 4, 3]);
  });

  it("uses the column's own comparator and ignores non-sortable or unknown columns", () => {
    const data: Term[] = [
      { id: 1, name: "abc", order: 0 },
      { id: 2, name: "a", order: 0 },
      { id: 3, name: "ab", order: 0 },
    ];
    const custom = sortTableRows(data, { prop: "custom", order: "ascending" }, columns);
    expect(custom.map((r) => r.row.id)).toEqual([2, 3, 1]);
    expect(
      sortTableRows(terms, { prop: "name", order: "ascending" }, columns).map((r) => r.row.id),
    ).toEqual([1, 2, 3, 4]);
    expect(
      sortTableRows(terms, { prop: "nope", order: "ascending" }, columns).map((r) => r.row.id),
    ).toEqual([1, 2, 3, 4]);
  });

  it("is stable: equal rows stay in data order", () => {
    const data: Term[] = [
      { id: 1, name: "a", order: 1 },
      { id: 2, name: "b", order: 1 },
      { id: 3, name: "c", order: 0 },
    ];
    const rows = sortTableRows(data, { prop: "order", order: "ascending" }, columns);
    expect(rows.map((r) => r.row.id)).toEqual([3, 1, 2]);
  });

  it("marks sortable columns and prepends a track for the selection column", () => {
    // 子组件写法里裸写 `sortable` 到 vnode 上是空串，也算开
    expect(tableColumnSortable("")).toBe(true);
    expect(tableColumnSortable(false)).toBe(false);
    expect(tableColumnSortable(undefined)).toBe(false);
    const resolved = resolveTableColumns(columns);
    expect(resolved.map((c) => c.sortable)).toEqual([true, false, true, true]);
    expect(resolved[0]!.headClass).toBe("m-table__th m-table__th--center m-table__th--sortable");
    expect(resolved[1]!.headClass).toBe("m-table__th m-table__th--center");
    expect(tableGridTemplate([{ width: 80 }, {}], "multiple")).toBe("max-content 80px auto");
    expect(tableGridTemplate([{ width: 80 }, {}], false)).toBe("80px auto");
  });
});

describe("selection", () => {
  const selectable = (row: Term) => row.id !== 2;

  it("reports all / some / count / total over the selectable rows only", () => {
    expect(tableSelectionState([], terms, "id")).toEqual({
      all: false,
      some: false,
      count: 0,
      total: 4,
    });
    expect(tableSelectionState([1], terms, "id")).toEqual({
      all: false,
      some: true,
      count: 1,
      total: 4,
    });
    expect(tableSelectionState([1, 2, 3, 4], terms, "id")).toEqual({
      all: true,
      some: false,
      count: 4,
      total: 4,
    });
    // 禁选的 2 不算：其余三行选满就是全选，就算 2 也在 keys 里也不影响
    expect(tableSelectionState([1, 3, 4], terms, "id", selectable)).toEqual({
      all: true,
      some: false,
      count: 3,
      total: 3,
    });
    expect(tableSelectionState([2], terms, "id", selectable)).toEqual({
      all: false,
      some: false,
      count: 0,
      total: 3,
    });
    // 一行可选的都没有：什么都不算全选
    expect(tableSelectionState([], [], "id")).toEqual({
      all: false,
      some: false,
      count: 0,
      total: 0,
    });
  });

  it("toggles one key; single mode keeps only the latest", () => {
    expect(toggleTableSelection([1], 3, true, "multiple")).toEqual([1, 3]);
    expect(toggleTableSelection([1, 3], 3, true, "multiple")).toEqual([1, 3]);
    expect(toggleTableSelection([1, 3], 1, false, "multiple")).toEqual([3]);
    expect(toggleTableSelection([1], 3, true, "single")).toEqual([3]);
    expect(toggleTableSelection([3], 3, false, "single")).toEqual([]);
  });

  it("selects / clears all selectable rows and leaves foreign keys alone", () => {
    expect(toggleAllTableSelection([], terms, "id", undefined, true)).toEqual([1, 2, 3, 4]);
    expect(toggleAllTableSelection([99, 3], terms, "id", selectable, true)).toEqual([99, 3, 1, 4]);
    expect(toggleAllTableSelection([99, 1, 2, 3], terms, "id", selectable, false)).toEqual([99, 2]);
  });

  it("maps keys back to rows and derives the row classes", () => {
    expect(tableSelectedRows([3, 1, 99], terms, "id")).toEqual([terms[0], terms[2]]);
    expect(tableSelectedRows([0, 2], terms, undefined)).toEqual([terms[0], terms[2]]);
    expect(tableRowClasses({ selected: true })).toEqual([
      "m-table__row",
      "m-table__row--body",
      "m-table__row--selected",
    ]);
    expect(tableRowClasses({ selected: false })).toEqual(["m-table__row", "m-table__row--body"]);
  });
});
