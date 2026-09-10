import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MTable, MTableColumn, type TableCellScope } from ".";

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
  it("renders header and rows from the columns prop with cell / head slots", async () => {
    const screen = await render(MTable<Term>, {
      props: {
        data: terms,
        columns: [
          { param: "id", label: "序号", width: 80 },
          { param: "name", label: "节气", align: "left" },
        ],
      },
      slots: {
        "cell-name": ({ row, value, index }: TableCellScope<Term>) =>
          `${index + 1}-${row.name}-${String(value)}`,
        "head-id": () => "编号",
      },
    });
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

  it("collects MTableColumn children in DOM order and renders their scoped slots", async () => {
    const screen = await render(MTable<Term>, {
      props: { data: terms },
      slots: {
        default: () => [
          h(MTableColumn, { param: "name", label: "节气" }),
          h(
            MTableColumn,
            { param: "id", label: "序号", align: "right" },
            {
              default: ({ data, index }: TableCellScope<Record<string, unknown>>) =>
                `#${String(data.id)}/${index}`,
              head: () => h("em", "编号"),
            },
          ),
        ],
      },
    });
    const headers = screen.getByRole("columnheader");
    await expect.element(headers.first()).toHaveTextContent("节气");
    await expect.element(headers.nth(1)).toHaveTextContent("编号");
    expect(screen.container.querySelector("th em")).not.toBeNull();
    const cells = screen.getByRole("cell");
    await expect.element(cells.first()).toHaveTextContent("立春");
    await expect.element(cells.nth(1)).toHaveTextContent("#1/0");
    await expect.element(cells.nth(1)).toHaveClass("m-table__td--right");
    await expect.element(cells.nth(1)).toHaveAttribute("data-param", "id");
  });

  it("shows empty text or the empty slot when there is no data", async () => {
    const plain = await render(MTable, {
      props: { columns: [{ param: "id", label: "序号" }] },
    });
    await expect.element(plain.getByText("暂无数据")).toBeInTheDocument();
    expect(plain.container.querySelector(".m-table__row--body")).toBeNull();

    const slotted = await render(MTable, {
      props: { columns: [{ param: "id", label: "序号" }] },
      slots: { empty: () => "千山鸟飞绝" },
    });
    await expect.element(slotted.getByText("千山鸟飞绝")).toBeInTheDocument();
  });

  it("emits rowClick, applies stripe and turns height into a scroll box", async () => {
    const onRowClick = vi.fn();
    const screen = await render(MTable<Term>, {
      props: {
        data: terms,
        columns: [{ param: "name" }],
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
});
