import { describe, expect, it } from "vitest";
import {
  descriptionsColumn,
  descriptionsGrid,
  descriptionsGridTemplate,
  descriptionsSpan,
  descriptionsValueText,
} from ".";

const item = (label: string, span?: number) => ({ label, span });

describe("descriptionsGrid", () => {
  it("wraps items into rows of `column` cells", () => {
    const grid = descriptionsGrid([item("a"), item("b"), item("c"), item("d")], { column: 3 });
    expect(grid.rows).toBe(2);
    expect(grid.cells.map((c) => [c.row, c.span])).toEqual([
      [1, 1],
      [1, 1],
      [1, 1],
      [2, 3],
    ]);
    // 横排：标签一条轨、值紧跟其后；第二条从第 3 轨起
    expect(grid.cells[1]!.labelStyle).toEqual({ gridRow: "1", gridColumn: "3" });
    expect(grid.cells[1]!.valueStyle).toEqual({ gridRow: "1", gridColumn: "4 / span 1" });
    // 最后一条补满整行：值跨 2*3-1 条轨
    expect(grid.cells[3]!.valueStyle).toEqual({ gridRow: "2", gridColumn: "2 / span 5" });
    expect(grid.template).toBe("repeat(3, auto minmax(0, 1fr))");
  });

  it("clamps span to the column count and to what is left in the row", () => {
    const grid = descriptionsGrid([item("a", 2), item("b", 5), item("c", 2), item("d")], {
      column: 3,
    });
    // b 想占 5 列：先截到 3，再截到本行剩下的 1
    expect(grid.cells.map((c) => [c.row, c.span, c.last])).toEqual([
      [1, 2, false],
      [1, 1, true],
      [2, 2, false],
      [2, 1, true],
    ]);
    expect(grid.rows).toBe(2);
  });

  it("stretches the last item to fill its row", () => {
    const grid = descriptionsGrid([item("a"), item("b"), item("c"), item("d")], { column: 3 });
    expect(grid.cells[3]!.span).toBe(3);
    expect(grid.cells[3]!.last).toBe(true);
    const single = descriptionsGrid([item("only")], { column: 4 });
    expect(single.cells[0]!.span).toBe(4);
    expect(single.rows).toBe(1);
  });

  it("flags the bottom row and the last cell of each row in the class names", () => {
    const grid = descriptionsGrid([item("a"), item("b"), item("c")], { column: 2 });
    expect(grid.cells.map((c) => c.bottom)).toEqual([false, false, true]);
    expect(grid.cells[0]!.valueClass).toBe("m-descriptions__value");
    expect(grid.cells[1]!.valueClass).toBe("m-descriptions__value m-descriptions__value--last");
    expect(grid.cells[2]!.labelClass).toBe(
      "m-descriptions__label m-descriptions__label--last m-descriptions__label--bottom",
    );
  });

  it("puts labels and values on alternating rows in the vertical layout", () => {
    const grid = descriptionsGrid([item("a"), item("b", 2), item("c")], {
      column: 3,
      layout: "vertical",
      bordered: true,
    });
    expect(grid.cells[1]!.labelStyle).toEqual({ gridRow: "1", gridColumn: "2 / span 2" });
    expect(grid.cells[1]!.valueStyle).toEqual({ gridRow: "2", gridColumn: "2 / span 2" });
    expect(grid.cells[2]!.labelStyle).toEqual({ gridRow: "3", gridColumn: "1 / span 3" });
    expect(grid.cells[2]!.valueStyle).toEqual({ gridRow: "4", gridColumn: "1 / span 3" });
    expect(grid.template).toBe("repeat(3, minmax(0, 1fr))");
    // 带格线：一条顶线 + 每个网格行一条底线（竖排一条数据占两行）
    expect(grid.lines.map((l) => [l.key, l.top, l.style.gridRow])).toEqual([
      ["top", true, "1"],
      ["r1", false, "1"],
      ["r2", false, "2"],
      ["r3", false, "3"],
      ["r4", false, "4"],
    ]);
  });

  it("draws no lines without bordered and none for an empty list", () => {
    expect(descriptionsGrid([item("a")], { column: 3 }).lines).toEqual([]);
    const empty = descriptionsGrid([], { column: 3, bordered: true });
    expect(empty.cells).toEqual([]);
    expect(empty.rows).toBe(0);
    expect(empty.lines).toEqual([]);
  });

  it("uses the item key when given, else the index", () => {
    const grid = descriptionsGrid([{ label: "a", key: "k" }, { label: "b" }], { column: 2 });
    expect(grid.cells.map((c) => c.key)).toEqual(["k", 1]);
  });
});

describe("normalisers", () => {
  it("defaults column to 3 and keeps it a positive integer", () => {
    expect(descriptionsColumn(undefined)).toBe(3);
    expect(descriptionsColumn(0)).toBe(1);
    expect(descriptionsColumn(2.7)).toBe(2);
  });

  it("keeps span within 1..column", () => {
    expect(descriptionsSpan(undefined, 3)).toBe(1);
    expect(descriptionsSpan(0, 3)).toBe(1);
    expect(descriptionsSpan(9, 3)).toBe(3);
  });

  it("prints values without leaking undefined", () => {
    expect(descriptionsValueText(undefined)).toBe("");
    expect(descriptionsValueText(null)).toBe("");
    expect(descriptionsValueText(0)).toBe("0");
    expect(descriptionsValueText("山")).toBe("山");
  });

  it("builds the grid template per layout", () => {
    expect(descriptionsGridTemplate(2, "horizontal")).toBe("repeat(2, auto minmax(0, 1fr))");
    expect(descriptionsGridTemplate(2, "vertical")).toBe("repeat(2, minmax(0, 1fr))");
  });
});
