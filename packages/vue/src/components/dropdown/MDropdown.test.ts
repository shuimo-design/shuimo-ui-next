import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MDropdown, type DropdownItem, type DropdownProps } from ".";

const items: DropdownItem[] = [
  { key: "edit", label: "编辑" },
  { key: "copy", label: "复制" },
  { key: "gone", label: "停用", disabled: true },
  { key: "remove", label: "删除", divided: true, danger: true },
];

function mount(props: Partial<DropdownProps> & Record<string, unknown> = {}) {
  return render(MDropdown, {
    props: { teleport: false, items, ...props },
    slots: { default: () => h("button", { type: "button" }, "更多") },
  });
}

type Screen = Awaited<ReturnType<typeof render>>;
const itemOf = (screen: Screen, name: string) =>
  screen.getByRole("menuitem", { name, exact: true });
const rowOf = (screen: Screen, name: string) => itemOf(screen, name).element() as HTMLElement;

describe("MDropdown", () => {
  it("opens on click, selects an item and closes", async () => {
    const onSelect = vi.fn();
    const onUpdate = vi.fn();
    const screen = await mount({ onSelect, "onUpdate:open": onUpdate });
    expect(screen.container.querySelector(".m-dropdown__menu")).toBeNull();

    const trigger = screen.getByRole("button", { name: "更多" });
    await expect.element(trigger).toHaveAttribute("aria-haspopup", "menu");
    await trigger.click();
    await expect.element(screen.getByRole("menu")).toBeVisible();
    expect(onUpdate).toHaveBeenCalledWith(true);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    // 分隔线和危险项
    expect(screen.container.querySelector('[role="separator"]')).not.toBeNull();
    expect(rowOf(screen, "删除").classList.contains("m-dropdown__item--danger")).toBe(true);

    await itemOf(screen, "复制").click();
    expect(onSelect).toHaveBeenCalledWith("copy", expect.objectContaining({ key: "copy" }));
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on hover", async () => {
    const screen = await mount({ trigger: "hover" });
    await screen.getByRole("button", { name: "更多" }).hover();
    await expect.element(screen.getByRole("menu")).toBeVisible();
  });

  it("ignores disabled items", async () => {
    const onSelect = vi.fn();
    const screen = await mount({ onSelect });
    await screen.getByRole("button", { name: "更多" }).click();
    await expect.element(itemOf(screen, "停用")).toHaveAttribute("aria-disabled", "true");
    await itemOf(screen, "停用").click({ force: true });
    expect(onSelect).not.toHaveBeenCalled();
    await expect.element(screen.getByRole("menu")).toBeVisible();
  });

  it("does nothing when disabled", async () => {
    const onUpdate = vi.fn();
    const screen = await mount({ disabled: true, "onUpdate:open": onUpdate });
    await screen.getByRole("button", { name: "更多" }).click();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.container.querySelector(".m-dropdown__menu")).toBeNull();
  });

  it("navigates with the keyboard", async () => {
    const onSelect = vi.fn();
    const screen = await mount({ onSelect });
    const trigger = screen.getByRole("button", { name: "更多" });
    (trigger.element() as HTMLElement).focus();
    // 触发元素上按下箭头：打开并聚焦第一项
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("menu")).toBeVisible();
    await vi.waitFor(() => expect(document.activeElement).toBe(rowOf(screen, "编辑")));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rowOf(screen, "复制"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(rowOf(screen, "删除"));
    // 循环：最后一项再往下回到第一项
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rowOf(screen, "编辑"));
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(rowOf(screen, "删除"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(rowOf(screen, "编辑"));
    // Escape 收起并把焦点还给触发元素
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger.element());
    // 再打开，回车选中
    await userEvent.keyboard("{ArrowDown}");
    await vi.waitFor(() => expect(document.activeElement).toBe(rowOf(screen, "编辑")));
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("edit", expect.objectContaining({ key: "edit" }));
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger.element());
  });

  it("renders the item slot and follows v-model:open", async () => {
    const Host = defineComponent({
      setup() {
        const open = ref(false);
        return () =>
          h("div", [
            h(
              MDropdown,
              {
                teleport: false,
                items,
                open: open.value,
                "onUpdate:open": (v: boolean) => (open.value = v),
              },
              {
                default: () => h("button", { type: "button" }, "更多"),
                item: ({ item }: { item: DropdownItem }) => h("em", `${item.label}！`),
              },
            ),
            h("button", { type: "button", onClick: () => (open.value = !open.value) }, "切换"),
          ]);
      },
    });
    const screen = await render(Host);
    // 用键盘按「切换」：鼠标点它同时也算点到菜单外面，两边会互相抵消
    (screen.getByRole("button", { name: "切换" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByText("编辑！")).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });
});
