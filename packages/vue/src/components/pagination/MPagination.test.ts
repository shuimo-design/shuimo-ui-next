import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, type PropType } from "vue";
import { MPagination } from ".";
import { buildPagers } from "./pager";

/** 父组件真的把值写回去，连续翻页才基于新值 */
const Host = defineComponent({
  props: {
    initial: { type: Number, default: 1 },
    extra: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
  },
  setup(props) {
    const current = ref(props.initial);
    const size = ref(10);
    return () =>
      h("div", [
        h(MPagination, {
          total: 95,
          ...props.extra,
          current: current.value,
          "onUpdate:current": (v: number) => (current.value = v),
          pageSize: size.value,
          "onUpdate:pageSize": (v: number) => (size.value = v),
        }),
        h("output", { "data-testid": "out" }, `${current.value}/${size.value}`),
      ]);
  },
});

describe("buildPagers", () => {
  const pages = (list: ReturnType<typeof buildPagers>) =>
    list.map((p) => (p.type === "page" ? p.page : `…${p.page}`));

  it("lists every page when the count is small", () => {
    expect(
      pages(
        buildPagers({ pageCount: 7, current: 3, foldedMax: 5, maxPageBtn: 10, showEdge: true }),
      ),
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("folds around the current page and keeps both edges", () => {
    expect(
      pages(
        buildPagers({ pageCount: 20, current: 1, foldedMax: 5, maxPageBtn: 10, showEdge: true }),
      ),
    ).toEqual([1, 2, 3, 4, "…4", 20]);
    expect(
      pages(
        buildPagers({ pageCount: 20, current: 10, foldedMax: 5, maxPageBtn: 10, showEdge: true }),
      ),
    ).toEqual([1, "…7", 9, 10, 11, "…13", 20]);
    expect(
      pages(
        buildPagers({ pageCount: 20, current: 20, foldedMax: 5, maxPageBtn: 10, showEdge: true }),
      ),
    ).toEqual([1, "…17", 17, 18, 19, 20]);
  });

  it("drops the edges when asked", () => {
    expect(
      pages(
        buildPagers({ pageCount: 20, current: 10, foldedMax: 5, maxPageBtn: 10, showEdge: false }),
      ),
    ).toEqual(["…5", 8, 9, 10, 11, 12, "…15"]);
  });
});

describe("MPagination", () => {
  it("changes page with the pager, arrows and folds", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, { props: { extra: { onChange } } });
    const prev = screen.getByRole("button", { name: "上一页" });
    await expect.element(prev).toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "第 1 页" }))
      .toHaveAttribute("aria-current", "page");

    await screen.getByRole("button", { name: "第 3 页" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("3/10");
    expect(onChange).toHaveBeenLastCalledWith(3);

    await screen.getByRole("button", { name: "下一页" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("4/10");
    await expect.element(prev).not.toBeDisabled();

    await screen.getByRole("button", { name: "第 10 页" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("10/10");
    await expect.element(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
    await expect.element(screen.getByText("共 95 条")).toBeVisible();
  });

  it("folds long ranges and jumps through the ellipsis", async () => {
    const screen = await render(Host, { props: { initial: 10, extra: { total: 500 } } });
    // 1 … 9 10 11 … 50
    expect(screen.container.querySelectorAll(".m-pagination__fold").length).toBe(2);
    await screen.getByRole("button", { name: "向后 3 页" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("13/10");
  });

  it("jumps with the input and switches page size", async () => {
    const onSizeChange = vi.fn();
    const screen = await render(Host, {
      props: {
        extra: { layout: "sizes, pager, jumper", onSizeChange },
      },
    });
    const input = screen.getByRole("spinbutton", { name: "跳转页码" });
    await userEvent.fill(input, "7");
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("7/10");
    // 越界收到最后一页
    await userEvent.fill(input, "99");
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("10/10");

    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "50 条/页" }).click();
    expect(onSizeChange).toHaveBeenCalledWith(50);
    // 95 条按 50 一页只剩 2 页，当前页从 10 收回到 2
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2/50");
  });

  it("does nothing while disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(MPagination, {
      props: { total: 50, current: 2, disabled: true, onChange },
    });
    await expect.element(screen.getByRole("button", { name: "第 3 页" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
    await expect.element(screen.getByRole("spinbutton", { name: "跳转页码" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides itself on a single page when asked", async () => {
    const screen = await render(MPagination, { props: { total: 5, hideOnSinglePage: true } });
    expect(screen.container.querySelector(".m-pagination")).toBeNull();
  });
});
