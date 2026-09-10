import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MTooltip, type TooltipProps } from ".";

function mount(props: TooltipProps & Record<string, unknown> = {}) {
  return render(MTooltip, {
    props: { teleport: false, content: "黄河之水天上来", openDelay: 0, closeDelay: 0, ...props },
    slots: { default: () => h("button", { type: "button" }, "移入") },
  });
}

describe("MTooltip", () => {
  it("shows on hover with role tooltip and describes the first slot element", async () => {
    const onVisibleChange = vi.fn();
    const screen = await mount({ onVisibleChange });
    const trigger = screen.getByRole("button", { name: "移入" });
    expect(screen.container.querySelector('[role="tooltip"]')).toBeNull();

    await trigger.hover();
    const tip = screen.getByRole("tooltip");
    await expect.element(tip).toBeVisible();
    await expect.element(tip).toHaveTextContent("黄河之水天上来");
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    // 参照元素是按钮本身（壳不占盒子），aria-describedby 指到提示上
    const id = tip.element().id;
    expect(id).not.toBe("");
    await expect.element(trigger).toHaveAttribute("aria-describedby", id);

    await trigger.unhover();
    await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
  });

  it("is reachable by keyboard: focusing the trigger shows it, Escape hides it", async () => {
    const screen = await mount();
    await userEvent.tab();
    await expect.element(screen.getByRole("button", { name: "移入" })).toHaveFocus();
    await expect.element(screen.getByRole("tooltip")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
  });

  it("supports click trigger and the content slot", async () => {
    const screen = await render(MTooltip, {
      props: { teleport: false, trigger: "click" },
      slots: {
        default: () => h("button", { type: "button" }, "点我"),
        content: () => h("span", "君不见"),
      },
    });
    const trigger = screen.getByRole("button", { name: "点我" });
    await trigger.click();
    await expect.element(screen.getByRole("tooltip")).toHaveTextContent("君不见");
    await trigger.click();
    await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
  });

  it("wraps plain text in an inline box and still works", async () => {
    const screen = await render(MTooltip, {
      props: { teleport: false, content: "提示", openDelay: 0 },
      slots: { default: () => "纯文本" },
    });
    const wrapper = screen.container.querySelector(".m-tooltip");
    expect(wrapper?.classList.contains("m-tooltip--wrap")).toBe(true);
    await screen.getByText("纯文本").hover();
    await expect.element(screen.getByRole("tooltip")).toBeVisible();
  });

  it("does nothing when disabled", async () => {
    const onVisibleChange = vi.fn();
    const screen = await mount({ disabled: true, onVisibleChange });
    await screen.getByRole("button", { name: "移入" }).hover();
    await userEvent.tab();
    expect(onVisibleChange).not.toHaveBeenCalled();
    expect(screen.container.querySelector('[role="tooltip"]')).toBeNull();
  });
});
