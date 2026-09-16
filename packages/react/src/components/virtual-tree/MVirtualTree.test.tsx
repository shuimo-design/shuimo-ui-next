import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { useState, type RefObject } from "react";
import { MVirtualTree, type VirtualTreeExpose } from ".";
import type { TreeKey, TreeNodeData } from "../tree";

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

/** 一棵全部展开后有几百行可见的树：只有它才能把"只渲染窗口"和"滚出窗口"测出来 */
const big: TreeNodeData[] = Array.from({ length: 120 }, (_, i) => ({
  key: `root-${i}`,
  label: `根 ${i}`,
  children: Array.from({ length: 3 }, (_, j) => ({ key: `leaf-${i}-${j}`, label: `叶 ${i}-${j}` })),
}));

const item = (screen: Awaited<ReturnType<typeof render>>, name: string) =>
  screen.getByRole("treeitem", { name, exact: true });
/** 树里的勾选框没有文字，input 中心被外观层盖住，点击要落在 label 上 */
const clickCheckbox = async (screen: Awaited<ReturnType<typeof render>>, name: string) => {
  const label = item(screen, name).getByRole("checkbox").first().element().closest("label");
  if (!label) throw new Error(`没有 ${name} 的勾选框`);
  await userEvent.click(label);
};
const renderedIndexes = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(".m-tree-row")).map((el) =>
    Number(el.dataset.index),
  );
const settle = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/** 三个双向绑定的测试台，断言和 Vue 那边逐字一致 */
function Demo(props: {
  checkable?: boolean;
  checkStrictly?: boolean;
  defaultExpandAll?: boolean;
  height?: number;
  itemHeight?: number;
}) {
  const [expanded, setExpanded] = useState<TreeKey[]>([]);
  const [checked, setChecked] = useState<TreeKey[]>([]);
  const [selected, setSelected] = useState<TreeKey | undefined>(undefined);
  return (
    <div>
      <MVirtualTree
        data={data}
        checkable={props.checkable}
        checkStrictly={props.checkStrictly}
        defaultExpandAll={props.defaultExpandAll}
        height={props.height}
        itemHeight={props.itemHeight}
        expandedKeys={expanded}
        checkedKeys={checked}
        selectedKey={selected}
        onExpandedKeysChange={setExpanded}
        onCheckedKeysChange={setChecked}
        onSelectedKeyChange={setSelected}
      />
      <output data-testid="expanded">{[...expanded].sort().join(",")}</output>
      <output data-testid="checked">{[...checked].sort().join(",")}</output>
      <output data-testid="selected">{String(selected ?? "")}</output>
    </div>
  );
}

describe("MVirtualTree", () => {
  it("renders only the rows around the viewport", async () => {
    const screen = await render(
      <MVirtualTree data={big} defaultExpandAll itemHeight={32} height={128} />,
    );
    await settle();
    const indexes = renderedIndexes(screen.container);
    // 480 行只渲染一屏加缓冲；顶上没有可缓冲的，从 0 开始
    expect(indexes.length).toBeLessThan(20);
    expect(indexes[0]).toBe(0);
    const first = screen.container.querySelector<HTMLElement>(".m-tree-row")!;
    expect(first.textContent).toContain("根 0");
  });

  it("lets itemHeight win over the row's min-height, so rows line up with the prefix sums", async () => {
    // 行皮肤自带 min-height: 32px；定高 24 时它必须让位，否则真实行高 32 和按 24 算的占位对不上
    const screen = await render(
      <MVirtualTree data={big} defaultExpandAll itemHeight={24} height={240} />,
    );
    await settle();
    const rows = screen.container.querySelectorAll<HTMLElement>(".m-tree-row");
    expect(rows[0]!.getBoundingClientRect().height).toBe(24);
    expect(rows[1]!.getBoundingClientRect().top - rows[0]!.getBoundingClientRect().top).toBe(24);
  });

  it("expands a node from the arrow and reports onExpandedKeysChange", async () => {
    const screen = await render(<Demo />);
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

  it("selects on click and emits onNodeClick, but not on a disabled node", async () => {
    const onNodeClick = vi.fn();
    const onSelectedKeyChange = vi.fn();
    const screen = await render(
      <MVirtualTree
        data={data}
        onNodeClick={onNodeClick}
        onSelectedKeyChange={onSelectedKeyChange}
      />,
    );
    await screen.getByText("云").click();
    expect(onSelectedKeyChange).toHaveBeenCalledWith("yun");
    expect(onNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ key: "yun", label: "云" }),
      expect.any(MouseEvent),
    );
    await expect.element(item(screen, "云")).toHaveAttribute("aria-selected", "true");

    await screen.getByText("石").click();
    expect(onSelectedKeyChange).toHaveBeenCalledTimes(1);
    await expect.element(item(screen, "石")).toHaveAttribute("aria-disabled", "true");
  });

  it("cascades checks between parent and children", async () => {
    const screen = await render(<Demo checkable defaultExpandAll />);
    await clickCheckbox(screen, "山");
    await expect.element(screen.getByTestId("checked")).toHaveTextContent("shan,song,zhu");
    await expect.element(item(screen, "松").getByRole("checkbox").first()).toBeChecked();

    await clickCheckbox(screen, "松");
    await expect.element(screen.getByTestId("checked")).toHaveTextContent("zhu");
    await expect
      .element(item(screen, "山").getByRole("checkbox").first())
      .toHaveAttribute("aria-checked", "mixed");

    await clickCheckbox(screen, "竹");
    await expect.element(screen.getByTestId("checked")).toHaveTextContent("");
  });

  it("moves focus with arrow keys, including a jump that has to scroll (Home)", async () => {
    const screen = await render(
      <MVirtualTree data={big} defaultExpandAll itemHeight={32} height={128} />,
    );
    await settle();
    // 先滚到中段，把窗口挪到 100 行附近（scroll 事件会更新窗口）
    const viewport = screen.container.querySelector<HTMLElement>(".m-virtual-tree");
    viewport!.scrollTop = 3200;
    viewport!.dispatchEvent(new Event("scroll"));
    await settle();
    const mid = screen.container.querySelector<HTMLElement>('[data-index="100"]');
    expect(mid).not.toBeNull();
    mid!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("data-index")).toBe("101");

    // Home 的目标在第 0 行，不在渲染窗口里：先滚过去，行挂上来后补聚焦
    await userEvent.keyboard("{Home}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-index")).toBe("0");
    });
    expect(document.activeElement?.textContent).toContain("根 0");
  });

  it("hands focus to the container when the focused row scrolls out, and an arrow key brings it back", async () => {
    const screen = await render(
      <MVirtualTree data={big} defaultExpandAll itemHeight={32} height={128} />,
    );
    await settle();
    const viewport = screen.container.querySelector<HTMLElement>(".m-virtual-tree")!;
    const first = screen.container.querySelector<HTMLElement>('[data-index="0"]')!;
    first.focus();
    // 用鼠标（这里直接改 scrollTop）把焦点行滚出渲染窗口：行被卸掉，焦点不能掉到 body
    viewport.scrollTop = 3200;
    viewport.dispatchEvent(new Event("scroll"));
    await settle();
    expect(screen.container.querySelector('[data-index="0"]')).toBeNull();
    expect(document.activeElement).toBe(viewport);
    // 方向键把焦点送回原来那一行（顺带滚回去）
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => {
      expect(document.activeElement?.getAttribute("data-index")).toBe("0");
    });
  });

  it("scrolls a far node into view via scrollToKey", async () => {
    const treeRef: RefObject<VirtualTreeExpose | null> = { current: null };
    const screen = await render(
      <div>
        <MVirtualTree ref={treeRef} data={big} defaultExpandAll itemHeight={32} height={128} />
        <button
          data-testid="jump"
          onClick={() => treeRef.current?.scrollToKey("leaf-100-2", "center")}
        >
          跳
        </button>
      </div>,
    );
    await screen.getByTestId("jump").click();
    // 目标行本来在渲染窗口外，滚过去之后它应该被渲染出来
    await vi.waitFor(() => {
      const row = Array.from(screen.container.querySelectorAll<HTMLElement>(".m-tree-row")).find(
        (el) => el.textContent?.includes("叶 100-2"),
      );
      expect(row).toBeDefined();
    });
  });

  it("maps field names and renders the label", async () => {
    const screen = await render(
      <MVirtualTree
        data={[{ id: 1, name: "墨", nodes: [{ id: 2, name: "砚" }] }]}
        fieldNames={{ key: "id", label: "name", children: "nodes" }}
        defaultExpandAll
        itemHeight={32}
        renderLabel={({ node, level }) => `${level}-${node.label}`}
      />,
    );
    await expect.element(screen.getByText("0-墨")).toBeVisible();
    await expect.element(screen.getByText("1-砚")).toBeVisible();
  });
});
