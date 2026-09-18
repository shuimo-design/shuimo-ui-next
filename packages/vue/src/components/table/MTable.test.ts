import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MTable, MTableColumn, type TableCellScope, type TableSort, type VueTableColumn } from ".";

interface Term {
  id: number;
  name: string;
}

const terms: Term[] = [
  { id: 1, name: "立春" },
  { id: 2, name: "雨水" },
  { id: 3, name: "惊蛰" },
];

describe("MTable", () => {
  it("renders header and rows from the columns prop with render / renderHead", async () => {
    const columns: VueTableColumn<Term>[] = [
      { prop: "id", label: "序号", width: 80, renderHead: () => "编号" },
      {
        prop: "name",
        label: "节气",
        align: "left",
        render: ({ row, value, index }) => `${index + 1}-${row.name}-${String(value)}`,
      },
    ];
    const screen = await render(MTable<Term>, { props: { data: terms, columns } });
    const headers = screen.getByRole("columnheader");
    expect(headers.elements()).toHaveLength(2);
    await expect.element(headers.first()).toHaveTextContent("编号");
    await expect.element(headers.nth(1)).toHaveTextContent("节气");
    await expect.element(headers.nth(1)).toHaveClass("m-table__th--left");

    const rows = screen.container.querySelectorAll(".m-table__row--body");
    expect(rows).toHaveLength(3);
    const cells = screen.getByRole("cell");
    await expect.element(cells.first()).toHaveTextContent("1");
    await expect.element(cells.nth(1)).toHaveTextContent("1-立春-立春");
    // 列宽变成 grid 轨道，没给宽度的列按内容分配
    const inner = screen.container.querySelector<HTMLElement>(".m-table__inner")!;
    expect(inner.style.gridTemplateColumns).toBe("80px auto");
  });

  it("collects MTableColumn children in written order and renders their scoped slots", async () => {
    const screen = await render(MTable<Term>, {
      props: { data: terms },
      slots: {
        default: () => [
          h(MTableColumn, { prop: "name", label: "节气", sortable: true }),
          h(
            MTableColumn,
            { prop: "id", label: "序号", align: "right" },
            {
              default: ({ data, index }: TableCellScope<Term>) => `#${String(data.id)}/${index}`,
              head: () => h("em", "编号"),
            },
          ),
        ],
      },
    });
    const headers = screen.getByRole("columnheader");
    await expect.element(headers.first()).toHaveTextContent("节气");
    await expect.element(headers.first()).toHaveAttribute("aria-sort", "none");
    await expect.element(headers.nth(1)).toHaveTextContent("编号");
    expect(screen.container.querySelector("th em")).not.toBeNull();
    const cells = screen.getByRole("cell");
    await expect.element(cells.first()).toHaveTextContent("立春");
    await expect.element(cells.nth(1)).toHaveTextContent("#1/0");
    await expect.element(cells.nth(1)).toHaveClass("m-table__td--right");
    await expect.element(cells.nth(1)).toHaveAttribute("data-prop", "id");
  });

  it("keeps the columns array order even when a v-for sits in the middle", async () => {
    const screen = await render(MTable<Term>, {
      props: {
        data: terms.slice(0, 1),
        columns: [
          { prop: "id", label: "一" },
          { prop: "name", label: "二" },
          { prop: "id", label: "三" },
        ] satisfies VueTableColumn<Term>[],
      },
    });
    const headers = screen.getByRole("columnheader").elements();
    expect(headers.map((th) => th.textContent?.trim())).toEqual(["一", "二", "三"]);
  });

  it("shows empty text or the empty slot when there is no data", async () => {
    const plain = await render(MTable, {
      props: { columns: [{ prop: "id", label: "序号" }] },
    });
    await expect.element(plain.getByText("暂无数据")).toBeInTheDocument();
    expect(plain.container.querySelector(".m-table__row--body")).toBeNull();

    const slotted = await render(MTable, {
      props: { columns: [{ prop: "id", label: "序号" }] },
      slots: { empty: () => "千山鸟飞绝" },
    });
    await expect.element(slotted.getByText("千山鸟飞绝")).toBeInTheDocument();
  });

  it("emits rowClick, applies stripe and turns height into a scroll box", async () => {
    const onRowClick = vi.fn();
    const screen = await render(MTable<Term>, {
      props: {
        data: terms,
        columns: [{ prop: "name" }],
        stripe: true,
        height: "120px",
        rowKey: "id",
        onRowClick,
      },
    });
    const root = screen.container.querySelector<HTMLElement>(".m-table")!;
    expect(root.classList.contains("m-table--stripe")).toBe(true);
    expect(root.classList.contains("m-table--scroll")).toBe(true);
    const scroll = screen.container.querySelector<HTMLElement>(".m-table__scroll")!;
    expect(scroll.style.maxHeight).toBe("120px");
    // 量到宽度后按实际宽度生成了笔触线
    await vi.waitFor(() => {
      expect(getComputedStyle(root).getPropertyValue("--m-table-line-thick")).toMatch(/^url\(/);
    });
    await screen.getByRole("cell").nth(1).click();
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick.mock.calls[0]?.[0]).toEqual(terms[1]);
    expect(onRowClick.mock.calls[0]?.[1]).toBe(1);
  });

  const names = (screen: { container: Element }) =>
    [...screen.container.querySelectorAll('.m-table__td[data-prop="name"]')].map((td) =>
      td.textContent?.trim(),
    );

  it("cycles a sortable header ascending → descending → none and emits sortChange", async () => {
    const onSortChange = vi.fn();
    const screen = await render(MTable<Term>, {
      props: {
        data: [terms[2]!, terms[0]!, terms[1]!],
        columns: [
          { prop: "id", label: "序号", sortable: true },
          { prop: "name", label: "节气" },
        ],
        rowKey: "id",
        onSortChange,
      },
    });
    const header = screen.getByRole("columnheader", { name: "序号" });
    await expect.element(header).toHaveAttribute("aria-sort", "none");
    // 不可排的列没有 aria-sort，也没有按钮
    await expect
      .element(screen.getByRole("columnheader", { name: "节气" }))
      .not.toHaveAttribute("aria-sort");
    expect(screen.container.querySelectorAll(".m-table__sort")).toHaveLength(1);
    expect(names(screen)).toEqual(["惊蛰", "立春", "雨水"]);

    const button = screen.getByRole("button", { name: "序号" });
    await button.click();
    await expect.element(header).toHaveAttribute("aria-sort", "ascending");
    await expect.element(button).toHaveClass("m-table__sort--ascending");
    expect(names(screen)).toEqual(["立春", "雨水", "惊蛰"]);
    expect(onSortChange).toHaveBeenLastCalledWith({ prop: "id", order: "ascending" });

    await button.click();
    await expect.element(header).toHaveAttribute("aria-sort", "descending");
    expect(names(screen)).toEqual(["惊蛰", "雨水", "立春"]);
    expect(onSortChange).toHaveBeenLastCalledWith({ prop: "id", order: "descending" });

    await button.click();
    await expect.element(header).toHaveAttribute("aria-sort", "none");
    expect(names(screen)).toEqual(["惊蛰", "立春", "雨水"]);
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(onSortChange).toHaveBeenCalledTimes(3);
  });

  it("starts from defaultSort and only emits when sortRemote", async () => {
    const onSortChange = vi.fn();
    const onUpdate = vi.fn();
    const screen = await render(MTable<Term>, {
      props: {
        data: terms,
        columns: [{ prop: "id", label: "序号", sortable: true }, { prop: "name" }],
        rowKey: "id",
        defaultSort: { prop: "id", order: "descending" } satisfies TableSort,
        sortRemote: true,
        onSortChange,
        "onUpdate:sort": onUpdate,
      },
    });
    const header = screen.getByRole("columnheader", { name: "序号" });
    await expect.element(header).toHaveAttribute("aria-sort", "descending");
    // 服务端排序：行序原样，只发事件
    expect(names(screen)).toEqual(["立春", "雨水", "惊蛰"]);
    await screen.getByRole("button", { name: "序号" }).click();
    await expect.element(header).toHaveAttribute("aria-sort", "none");
    expect(names(screen)).toEqual(["立春", "雨水", "惊蛰"]);
    expect(onSortChange).toHaveBeenCalledWith(null);
    expect(onUpdate).toHaveBeenCalledWith(null);
  });
});
