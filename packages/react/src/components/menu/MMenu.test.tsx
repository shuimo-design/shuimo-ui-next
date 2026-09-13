import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MMenu, MMenuItem, type MenuItemData, type MenuKey } from ".";

const data: MenuItemData[] = [
  {
    key: "home",
    label: "首页",
    children: [
      { key: "quick", label: "快速开始" },
      { key: "color", label: "颜色" },
    ],
  },
  {
    key: "base",
    label: "基础组件",
    children: [
      { key: "button", label: "按钮" },
      { key: "input", label: "输入框", disabled: true },
    ],
  },
  { key: "about", label: "关于" },
  { key: "gone", label: "停用", disabled: true },
];

/** 和 Vue 那份一样的受控宿主：两个绑定值都记在外面，断言直接读 output */
function Demo(props: { initial?: MenuKey; defaultExpandAll?: boolean }) {
  const [current, setCurrent] = useState<MenuKey | undefined>(props.initial);
  const [expanded, setExpanded] = useState<MenuKey[]>([]);
  return (
    <div>
      <MMenu
        data={data}
        defaultExpandAll={props.defaultExpandAll}
        value={current}
        expandedKeys={expanded}
        onValueChange={setCurrent}
        onExpandedKeysChange={setExpanded}
      />
      <output data-testid="current">{String(current ?? "")}</output>
      <output data-testid="expanded">{[...expanded].sort().join(",")}</output>
    </div>
  );
}

type Screen = Awaited<ReturnType<typeof render>>;
const itemOf = (screen: Screen, name: string) =>
  screen.getByRole("menuitem", { name, exact: true });
const rowOf = (screen: Screen, name: string) => itemOf(screen, name).element() as HTMLElement;

// 断言和 Vue 那份逐字一致
describe("MMenu", () => {
  it("renders items from data and expands a submenu on click", async () => {
    const screen = await render(<Demo />);
    const home = itemOf(screen, "首页");
    await expect.element(home).toHaveAttribute("aria-expanded", "false");
    await home.click();
    await expect.element(home).toHaveAttribute("aria-expanded", "true");
    await expect.element(screen.getByTestId("expanded")).toHaveTextContent("home");
    await expect.element(itemOf(screen, "快速开始")).toBeVisible();
    // 点父项只切换展开，不改当前项
    await expect.element(screen.getByTestId("current")).toHaveTextContent("");
    await home.click();
    await expect.element(home).toHaveAttribute("aria-expanded", "false");
  });

  it("selects a leaf, writes the binding and fires onNodeClick / onChange", async () => {
    const onNodeClick = vi.fn();
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    const screen = await render(
      <MMenu
        data={data}
        onNodeClick={onNodeClick}
        onChange={onChange}
        onValueChange={onValueChange}
      />,
    );
    await itemOf(screen, "关于").click();
    expect(onValueChange).toHaveBeenCalledWith("about");
    expect(onChange).toHaveBeenCalledWith("about");
    expect(onNodeClick).toHaveBeenCalledWith(
      expect.objectContaining({ key: "about", label: "关于", level: 0 }),
      expect.any(MouseEvent),
    );
  });

  it("marks the current leaf and its ancestor, and auto-expands to it", async () => {
    const screen = await render(<Demo initial="button" />);
    const base = itemOf(screen, "基础组件");
    await expect.element(base).toHaveAttribute("aria-expanded", "true");
    await expect.element(itemOf(screen, "按钮")).toHaveAttribute("aria-current", "true");
    const baseItem = rowOf(screen, "基础组件").closest(".m-menu-item");
    expect(baseItem?.classList.contains("m-menu-item--active")).toBe(true);
    expect(baseItem?.classList.contains("m-menu-item--current")).toBe(false);
    // 首页那一支没有当前项，墨点不该变红
    const homeItem = rowOf(screen, "首页").closest(".m-menu-item");
    expect(homeItem?.classList.contains("m-menu-item--active")).toBe(false);
  });

  it("ignores disabled items", async () => {
    const onValueChange = vi.fn();
    const onNodeClick = vi.fn();
    const screen = await render(
      <MMenu
        data={data}
        defaultExpandAll
        onNodeClick={onNodeClick}
        onValueChange={onValueChange}
      />,
    );
    // defaultExpandAll 是挂载后才展开的，子菜单撑开的 240ms 里下面的行一直在往下滑。
    // force 点击不等元素稳定，取完坐标就按，那一瞬行已经滑走，按到的是上面那行"关于"
    // （根目录并行跑两套浏览器时偶发）。先 hover 一次：它要等位置连续两帧不变、且那个点
    // 命中的就是它自己，等的正是动画结束。带 aria-disabled 的元素 playwright 默认不肯点，
    // 之后的 click 才需要 force 跳过可点性检查
    await itemOf(screen, "停用").hover();
    await itemOf(screen, "停用").click({ force: true });
    await itemOf(screen, "输入框").click({ force: true });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onNodeClick).not.toHaveBeenCalled();
    await expect.element(itemOf(screen, "停用")).toHaveAttribute("aria-disabled", "true");
  });

  it("moves focus with arrow keys and skips collapsed submenus", async () => {
    const screen = await render(<Demo />);
    rowOf(screen, "首页").focus();
    await userEvent.keyboard("{ArrowDown}");
    // 首页没展开，下一项直接是基础组件
    expect(document.activeElement).toBe(rowOf(screen, "基础组件"));
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(itemOf(screen, "基础组件")).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(rowOf(screen, "按钮"));
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByTestId("current")).toHaveTextContent("button");
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(rowOf(screen, "基础组件"));
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(itemOf(screen, "基础组件")).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(rowOf(screen, "停用"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(rowOf(screen, "首页"));
  });

  it("renders hand-written MMenuItem and the label render prop", async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <MMenu onValueChange={onValueChange}>
        <MMenuItem name="a" label="甲">
          <MMenuItem name="a1" label="子" />
        </MMenuItem>
        <MMenuItem name="b" renderLabel={() => "乙（插槽）"} />
      </MMenu>,
    );
    await itemOf(screen, "甲").click();
    await expect.element(itemOf(screen, "子")).toBeVisible();
    await itemOf(screen, "乙（插槽）").click();
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("maps field names and renders the data label render prop", async () => {
    const screen = await render(
      <MMenu
        data={[{ id: 1, name: "墨", nodes: [{ id: 2, name: "砚" }] }]}
        fieldNames={{ key: "id", label: "name", children: "nodes" }}
        defaultExpandAll
        renderLabel={({ item, level }) => `${level}-${item.label}`}
      />,
    );
    await expect.element(screen.getByText("0-墨")).toBeVisible();
    await expect.element(screen.getByText("1-砚")).toBeVisible();
  });
});
