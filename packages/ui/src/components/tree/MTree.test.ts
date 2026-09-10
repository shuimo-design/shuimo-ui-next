import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MTree, type TreeKey, type TreeNodeData } from ".";

const data: TreeNodeData[] = [
  {
    key: "shan",
    label: "山",
    children: [
      { key: "song", label: "松" },
      { key: "zhu", label: "竹" },
    ],
  },
  { key: "shui", label: "水", children: [{ key: "yu", label: "鱼" }] },
  { key: "yun", label: "云" },
  { key: "shi", label: "石", disabled: true },
];

const Demo = defineComponent({
  props: {
    checkable: { type: Boolean, default: false },
    checkStrictly: { type: Boolean, default: false },
    defaultExpandAll: { type: Boolean, default: false },
  },
  setup(props) {
    const expanded = ref<TreeKey[]>([]);
    const checked = ref<TreeKey[]>([]);
    const selected = ref<TreeKey | undefined>(undefined);
    return () =>
      h("div", [
        h(MTree, {
          data,
          checkable: props.checkable,
          checkStrictly: props.checkStrictly,
          defaultExpandAll: props.defaultExpandAll,
          expandedKeys: expanded.value,
          checkedKeys: checked.value,
          selectedKey: selected.value,
          "onUpdate:expandedKeys": (v: TreeKey[]) => (expanded.value = v),
          "onUpdate:checkedKeys": (v: TreeKey[]) => (checked.value = v),
          "onUpdate:selectedKey": (v: TreeKey | undefined) => (selected.value = v),
        }),
        h("output", { "data-testid": "expanded" }, [...expanded.value].sort().join(",")),
        h("output", { "data-testid": "checked" }, [...checked.value].sort().join(",")),
        h("output", { "data-testid": "selected" }, String(selected.value ?? "")),
      ]);
  },
});

const item = (screen: Awaited<ReturnType<typeof render>>, name: string) =>
  screen.getByRole("treeitem", { name, exact: true });
/** 树里的勾选框没有文字，input 中心被外观层盖住，点击要落在 label 上 */
const checkboxOf = (screen: Awaited<ReturnType<typeof render>>, name: string) =>
  item(screen, name).getByRole("checkbox").first();
const clickCheckbox = async (screen: Awaited<ReturnType<typeof render>>, name: string) => {
  const label = checkboxOf(screen, name).element().closest("label");
  if (!label) throw new Error(`没有 ${name} 的勾选框`);
  await userEvent.click(label);
};
const rowOf = (screen: Awaited<ReturnType<typeof render>>, name: string) => {
  const row = item(screen, name).element().querySelector<HTMLElement>(".m-tree-node__row");
  if (!row) throw new Error(`没有 ${name} 的节点行`);
  return row;
};

describe("MTree", () => {
  it("expands a node from the arrow and writes v-model:expandedKeys", async () => {
    const screen = await render(Demo);
    const shan = item(screen, "山");
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
    await shan.getByRole("button", { name: "展开" }).click();
    await expect.element(shan).toHaveAttribute("aria-expanded", "true");
    await expect.element(screen.getByTestId("expanded")).toHaveTextContent("shan");
    await expect.element(item(screen, "松")).toBeVisible();
    await shan.getByRole("button", { name: "收起" }).click();
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByTestId("expanded")).toHaveTextContent("");
  });

  it("selects on click and emits nodeClick", async () => {
    const onNodeClick = vi.fn();
    const onUpdate = vi.fn();
    const screen = await render(MTree, {
      props: { data, onNodeClick, "onUpdate:selectedKey": onUpdate },
    });
    await screen.getByText("云").click();
    expect(onUpdate).toHaveBeenCalledWith("yun");
    expect(onNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ key: "yun", label: "云" }),
      expect.any(MouseEvent),
    );
    await expect.element(item(screen, "云")).toHaveAttribute("aria-selected", "true");
  });

  it("does not select a disabled node", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MTree, { props: { data, "onUpdate:selectedKey": onUpdate } });
    await screen.getByText("石").click();
    expect(onUpdate).not.toHaveBeenCalled();
    await expect.element(item(screen, "石")).toHaveAttribute("aria-disabled", "true");
  });

  it("cascades checks between parent and children", async () => {
    const screen = await render(Demo, { props: { checkable: true, defaultExpandAll: true } });
    const shanBox = checkboxOf(screen, "山");
    await clickCheckbox(screen, "山");
    await expect.element(screen.getByTestId("checked")).toHaveTextContent("shan,song,zhu");
    await expect.element(checkboxOf(screen, "松")).toBeChecked();

    await clickCheckbox(screen, "松");
    await expect.element(screen.getByTestId("checked")).toHaveTextContent("zhu");
    await expect.element(shanBox).toHaveAttribute("aria-checked", "mixed");

    await clickCheckbox(screen, "竹");
    await expect.element(screen.getByTestId("checked")).toHaveTextContent("");
    await expect.element(shanBox).not.toBeChecked();
  });

  it("checks nodes independently with checkStrictly", async () => {
    const screen = await render(Demo, {
      props: { checkable: true, checkStrictly: true, defaultExpandAll: true },
    });
    await clickCheckbox(screen, "山");
    await expect.element(screen.getByTestId("checked")).toHaveTextContent("shan");
    await expect.element(checkboxOf(screen, "松")).not.toBeChecked();
    await expect.element(checkboxOf(screen, "山")).toHaveAttribute("aria-checked", "true");
  });

  it("moves focus and toggles nodes with arrow keys", async () => {
    const screen = await render(Demo, { props: { defaultExpandAll: true } });
    rowOf(screen, "山").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rowOf(screen, "松"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rowOf(screen, "竹"));
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(rowOf(screen, "山"));
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(item(screen, "山")).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rowOf(screen, "水"));
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(item(screen, "山")).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByTestId("selected")).toHaveTextContent("shan");
  });

  it("expands nodes flagged with expand in the data on mount", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MTree, {
      props: {
        data: [
          { key: "tang", label: "唐", expand: true, children: [{ key: "libai", label: "李白" }] },
          { key: "song", label: "宋", children: [{ key: "sushi", label: "苏轼" }] },
        ],
        "onUpdate:expandedKeys": onUpdate,
      },
    });
    await expect.element(item(screen, "唐")).toHaveAttribute("aria-expanded", "true");
    await expect.element(item(screen, "宋")).toHaveAttribute("aria-expanded", "false");
    expect(onUpdate).toHaveBeenCalledWith(["tang"]);
    // 叶子没有箭头，父节点的箭头是一枚三角
    expect(item(screen, "唐").element().querySelector(".m-tree-node__arrow-shape")).not.toBeNull();
    expect(item(screen, "李白").element().querySelector(".m-tree-node__arrow-shape")).toBeNull();
  });

  it("maps field names and renders the label slot", async () => {
    const screen = await render(MTree, {
      props: {
        data: [{ id: 1, name: "墨", nodes: [{ id: 2, name: "砚" }] }],
        fieldNames: { key: "id", label: "name", children: "nodes" },
        defaultExpandAll: true,
      },
      slots: { default: ({ node, level }) => `${level}-${node.label}` },
    });
    await expect.element(screen.getByText("0-墨")).toBeVisible();
    await expect.element(screen.getByText("1-砚")).toBeVisible();
  });
});
