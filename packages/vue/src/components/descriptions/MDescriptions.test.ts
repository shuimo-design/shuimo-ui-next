import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import {
  MDescriptions,
  MDescriptionsItem,
  type DescriptionsItem,
  type DescriptionsItemScope,
} from ".";

const painting: DescriptionsItem[] = [
  { key: "title", label: "画名", value: "溪山行旅图" },
  { key: "author", label: "作者", value: "范宽" },
  { key: "era", label: "年代", value: "北宋" },
  { key: "note", label: "题跋", value: "董其昌题", span: 2 },
];

const Demo = defineComponent({
  setup() {
    const bordered = ref(false);
    const items = ref<DescriptionsItem[]>([...painting]);
    return () =>
      h("div", [
        h(MDescriptions, { items: items.value, bordered: bordered.value, title: "作品" }),
        h("button", { onClick: () => (bordered.value = !bordered.value) }, "格线"),
        h(
          "button",
          { onClick: () => (items.value = [...items.value, { label: "藏地", value: "台北" }]) },
          "追加",
        ),
      ]);
  },
});

function cellsOf(container: Element) {
  return {
    labels: [...container.querySelectorAll<HTMLElement>("dt")],
    values: [...container.querySelectorAll<HTMLElement>("dd")],
  };
}

describe("MDescriptions", () => {
  it("renders dt / dd pairs on a grid with the computed positions", async () => {
    const screen = await render(MDescriptions, { props: { items: painting, title: "作品" } });
    const root = screen.container.querySelector<HTMLElement>(".m-descriptions")!;
    expect(root.classList.contains("m-descriptions--horizontal")).toBe(true);
    expect(root.classList.contains("m-descriptions--md")).toBe(true);
    expect(root.classList.contains("m-descriptions--colon")).toBe(true);
    expect(root.querySelector(".m-descriptions__title")?.textContent).toBe("作品");
    const grid = root.querySelector<HTMLElement>(".m-descriptions__grid")!;
    // 浏览器会把 0 序列化成 0px
    expect(grid.style.gridTemplateColumns).toMatch(/^repeat\(3, auto minmax\(0(px)?, 1fr\)\)$/);
    expect(root.querySelector("dl.m-descriptions__list")).not.toBeNull();

    const { labels, values } = cellsOf(root);
    expect(labels.map((el) => el.textContent)).toEqual(["画名", "作者", "年代", "题跋"]);
    expect(values.map((el) => el.textContent?.trim())).toEqual([
      "溪山行旅图",
      "范宽",
      "北宋",
      "董其昌题",
    ]);
    // 第四条另起一行；作为最后一条补满整行
    expect(labels[3]!.style.gridRow).toBe("2");
    expect(values[3]!.style.gridColumn).toBe("2 / span 5");
    // 真的排成两行：题跋在第一行下面，作者在画名右边
    const title = labels[0]!.getBoundingClientRect();
    expect(labels[3]!.getBoundingClientRect().top).toBeGreaterThanOrEqual(title.bottom);
    expect(labels[1]!.getBoundingClientRect().left).toBeGreaterThan(title.right);
    // 不带格线时没有行线
    expect(root.querySelectorAll(".m-descriptions__line")).toHaveLength(0);
  });

  it("toggles bordered lines and re-renders when items change", async () => {
    const screen = await render(Demo);
    const root = screen.container.querySelector<HTMLElement>(".m-descriptions")!;
    await screen.getByRole("button", { name: "格线" }).click();
    expect(root.classList.contains("m-descriptions--bordered")).toBe(true);
    // 一条顶线 + 两行各一条底线
    const lines = root.querySelectorAll<HTMLElement>(".m-descriptions__line");
    expect(lines).toHaveLength(3);
    expect(lines[0]!.classList.contains("m-descriptions__line--top")).toBe(true);
    expect(lines[2]!.style.gridRow).toBe("2");
    // 行线压在两行的交界上
    const firstRowBottom = cellsOf(root).values[0]!.getBoundingClientRect().bottom;
    const line = lines[1]!.getBoundingClientRect();
    expect(Math.abs(line.top + line.height / 2 - firstRowBottom)).toBeLessThanOrEqual(1);
    // 量到宽度后按宽度生成的墨线写进变量
    await expect
      .poll(() => root.style.getPropertyValue("--m-descriptions-ink-band"))
      .toMatch(/px$/);

    // 追加一条：题跋不再是最后一条，收回到 span 2，新的一条正好补满第二行
    await screen.getByRole("button", { name: "追加" }).click();
    const { labels, values } = cellsOf(root);
    expect(labels).toHaveLength(5);
    expect(values[3]!.style.gridColumn).toBe("2 / span 3");
    expect(labels[4]!.style.gridRow).toBe("2");
    expect(root.querySelectorAll(".m-descriptions__line")).toHaveLength(3);
  });

  it("stacks label over value in the vertical layout", async () => {
    const screen = await render(MDescriptions, {
      props: { items: painting, layout: "vertical", column: 2, size: "sm" },
    });
    const root = screen.container.querySelector<HTMLElement>(".m-descriptions")!;
    expect(root.classList.contains("m-descriptions--vertical")).toBe(true);
    expect(root.classList.contains("m-descriptions--sm")).toBe(true);
    const { labels, values } = cellsOf(root);
    expect(labels[0]!.style.gridRow).toBe("1");
    expect(values[0]!.style.gridRow).toBe("2");
    expect(labels[2]!.style.gridRow).toBe("3");
    // 题跋 span 2 截到本行剩下的 1 列，最后一条补满：落在第 3 行第 2 轨
    expect(labels[3]!.style.gridColumn).toBe("2 / span 1");
    const label = labels[0]!.getBoundingClientRect();
    const value = values[0]!.getBoundingClientRect();
    expect(value.top).toBeGreaterThanOrEqual(label.bottom);
    expect(Math.abs(value.left - label.left)).toBeLessThan(1);
  });

  it("collects MDescriptionsItem children in written order with their slots", async () => {
    const screen = await render(MDescriptions, {
      props: { column: 2, colon: false },
      slots: {
        default: () => [
          h(MDescriptionsItem, { label: "形制", value: "立轴" }),
          h(MDescriptionsItem, { label: "状态" }, { default: () => h("b", "已修复") }),
          h(
            MDescriptionsItem,
            { key: "note", label: "说明", span: 2 },
            { default: () => "画心完好", label: () => h("em", "备注") },
          ),
        ],
      },
    });
    const root = screen.container.querySelector<HTMLElement>(".m-descriptions")!;
    expect(root.classList.contains("m-descriptions--colon")).toBe(false);
    const { labels, values } = cellsOf(root);
    expect(labels.map((el) => el.textContent)).toEqual(["形制", "状态", "备注"]);
    expect(labels[2]!.querySelector("em")).not.toBeNull();
    expect(values[1]!.querySelector("b")?.textContent).toBe("已修复");
    expect(values[2]!.textContent?.trim()).toBe("画心完好");
    expect(values[2]!.style.gridColumn).toBe("2 / span 3");
    // 没有标题也没有 extra 就不渲染头部
    expect(root.querySelector(".m-descriptions__header")).toBeNull();
  });

  it("renders the label / value scoped slots and the title / extra slots", async () => {
    const screen = await render(MDescriptions, {
      props: { items: painting.slice(0, 2), bordered: true },
      slots: {
        title: () => h("i", "标题插槽"),
        extra: () => h("button", "编辑"),
        label: ({ item }: DescriptionsItemScope) => `「${item.label}」`,
        value: ({ item }: DescriptionsItemScope) => h("strong", String(item.value)),
      },
    });
    const root = screen.container.querySelector<HTMLElement>(".m-descriptions")!;
    expect(root.querySelector(".m-descriptions__title i")?.textContent).toBe("标题插槽");
    await expect.element(screen.getByRole("button", { name: "编辑" })).toBeVisible();
    const { labels, values } = cellsOf(root);
    expect(labels[0]!.textContent).toBe("「画名」");
    expect(values[1]!.querySelector("strong")?.textContent).toBe("范宽");
  });
});
