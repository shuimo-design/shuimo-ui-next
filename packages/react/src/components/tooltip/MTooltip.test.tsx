import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MTooltip, type MTooltipProps } from ".";

function mount(props: Partial<MTooltipProps> = {}) {
  return render(
    <MTooltip teleport={false} content="黄河之水天上来" openDelay={0} closeDelay={0} {...props}>
      <button type="button">移入</button>
    </MTooltip>,
  );
}

// 每个用例只 render 一次：查询是全页面的，渲染两次会撞 strict mode
describe("MTooltip", () => {
  it("shows on hover with role tooltip and describes the first child element", async () => {
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

  it("supports the click trigger and a node as the tip", async () => {
    const screen = await mount({ trigger: "click", tip: <b>诗句</b> });
    const trigger = screen.getByRole("button", { name: "移入" });
    await trigger.click();
    await expect.element(screen.getByRole("tooltip")).toHaveTextContent("诗句");
    await trigger.click();
    await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
  });

  it("wraps plain text in an inline box and still works", async () => {
    const screen = await render(
      <MTooltip teleport={false} content="提示" openDelay={0} closeDelay={0}>
        纯文本
      </MTooltip>,
    );
    const wrap = screen.container.querySelector<HTMLElement>(".m-tooltip")!;
    // 壳里没有元素子节点时壳自己当参照，要占一个盒子
    expect(wrap.classList.contains("m-tooltip--wrap")).toBe(true);
    await userEvent.hover(wrap);
    await expect.element(screen.getByRole("tooltip")).toBeVisible();
  });

  it("does nothing when disabled", async () => {
    const screen = await mount({ disabled: true });
    await screen.getByRole("button", { name: "移入" }).hover();
    expect(screen.container.querySelector('[role="tooltip"]')).toBeNull();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
});
