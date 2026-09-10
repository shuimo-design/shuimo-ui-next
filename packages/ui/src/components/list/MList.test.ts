import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MList, MListItem, type ListItemScope } from ".";

interface Poem {
  title: string;
}

describe("MList", () => {
  it("renders one item per data entry with the scoped slot", async () => {
    const data: Poem[] = [{ title: "春晓" }, { title: "静夜思" }, { title: "登高" }];
    const screen = await render(MList<Poem>, {
      props: { data },
      slots: {
        default: ({ item, index }: ListItemScope<Poem>) => `${index + 1}. ${item.title}`,
      },
    });
    const items = screen.getByRole("listitem");
    expect(items.elements()).toHaveLength(3);
    await expect.element(items.nth(1)).toHaveTextContent("2. 静夜思");
    expect(items.elements().every((el) => el.classList.contains("m-list-item--marker"))).toBe(true);
  });

  it("falls back to plain text when no slot is given", async () => {
    const screen = await render(MList<string>, { props: { data: ["山", "水"] } });
    await expect.element(screen.getByRole("listitem").first()).toHaveTextContent("山");
  });

  it("takes active from the data item or from autoActive", async () => {
    const data = [{ title: "轩辕剑", active: true }, { title: "湛卢" }];
    const screen = await render(MList<{ title: string; active?: boolean }>, {
      props: { data },
      slots: { default: ({ item }: ListItemScope<{ title: string }>) => item.title },
    });
    const items = screen.getByRole("listitem");
    await expect.element(items.first()).toHaveClass("m-list-item--active");
    await expect.element(items.last()).not.toHaveClass("m-list-item--active");
    // 每一项都带一个符号元素，激活态只是换样式，不会让文字跳位
    expect(items.first().element().querySelector(".m-list-item__marker")).not.toBeNull();
  });

  it("activates every item with autoActive", async () => {
    const screen = await render(MList<string>, { props: { data: ["山", "水"], autoActive: true } });
    const items = screen.getByRole("listitem").elements();
    expect(items).toHaveLength(2);
    expect(items.every((el) => el.classList.contains("m-list-item--active"))).toBe(true);
  });

  it("renders the default slot as-is without data", async () => {
    const onClick = vi.fn();
    const screen = await render(MList, {
      props: { marker: false },
      slots: {
        default: () => [
          h(MListItem, { onClick }, { default: () => "云" }),
          h(MListItem, { active: true, marker: true }, { default: () => "月" }),
        ],
      },
    });
    const yun = screen.getByRole("listitem").first();
    const yue = screen.getByRole("listitem").last();
    await expect.element(yun).toHaveTextContent("云");
    // 不传 marker 跟随 MList（false）；显式传 true 则自己说了算
    await expect.element(yun).not.toHaveClass("m-list-item--marker");
    await expect.element(yue).toHaveClass("m-list-item--marker");
    await expect.element(yue).toHaveClass("m-list-item--active");
    await yun.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
