import { useState } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MPopover, type MPopoverProps } from ".";

function mount(props: Partial<MPopoverProps> = {}) {
  return render(
    <MPopover teleport={false} content="君不见，黄河之水天上来" {...props}>
      <button type="button">触发</button>
    </MPopover>,
  );
}

/** 气泡旁边放一个无关按钮，用来点「外面」 */
function OutsideHost({ disableClickAway }: { disableClickAway?: boolean }) {
  return (
    <div>
      <MPopover teleport={false} content="内容" disableClickAway={disableClickAway}>
        <button type="button">触发</button>
      </MPopover>
      <button type="button">外面</button>
    </div>
  );
}

// 每个用例只 render 一次：查询是全页面的，渲染两次会撞 strict mode
describe("MPopover", () => {
  it("toggles on click and reports visibility", async () => {
    const onShowChange = vi.fn();
    const onVisibleChange = vi.fn();
    const screen = await mount({ onShowChange, onVisibleChange });
    expect(screen.container.querySelector(".m-popover__float")).toBeNull();

    const trigger = screen.getByRole("button", { name: "触发" });
    await trigger.click();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    expect(onShowChange).toHaveBeenCalledWith(true);
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    // 参照元素就是插槽里的按钮，展开状态标在它身上
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");

    await trigger.click();
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    await expect.element(screen.getByText("君不见，黄河之水天上来")).not.toBeInTheDocument();
  });

  it("closes on outside click", async () => {
    const screen = await render(<OutsideHost />);
    await screen.getByRole("button", { name: "触发" }).click();
    await expect.element(screen.getByText("内容")).toBeVisible();
    await screen.getByRole("button", { name: "外面" }).click();
    await expect.element(screen.getByText("内容")).not.toBeInTheDocument();
  });

  it("stays open on outside click with disableClickAway", async () => {
    const screen = await render(<OutsideHost disableClickAway />);
    await screen.getByRole("button", { name: "触发" }).click();
    await screen.getByRole("button", { name: "外面" }).click();
    await expect.element(screen.getByText("内容")).toBeVisible();
  });

  it("opens on hover and closes after leaving", async () => {
    const screen = await mount({ trigger: "hover", closeDelay: 0 });
    const trigger = screen.getByRole("button", { name: "触发" });
    await trigger.hover();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    await trigger.unhover();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).not.toBeInTheDocument();
  });

  it("closes with Escape", async () => {
    const screen = await mount();
    await screen.getByRole("button", { name: "触发" }).click();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByText("君不见，黄河之水天上来")).not.toBeInTheDocument();
  });

  it("follows the show prop in manual mode", async () => {
    function Host() {
      const [show, setShow] = useState(false);
      return (
        <div>
          <MPopover teleport={false} trigger="manual" content="手动" show={show}>
            <button type="button">触发</button>
          </MPopover>
          <button type="button" onClick={() => setShow((v) => !v)}>
            切换
          </button>
        </div>
      );
    }
    const screen = await render(<Host />);
    // manual 下点参照元素不开
    await screen.getByRole("button", { name: "触发" }).click();
    expect(screen.container.querySelector(".m-popover__float")).toBeNull();
    await screen.getByRole("button", { name: "切换" }).click();
    await expect.element(screen.getByText("手动")).toBeVisible();
    await screen.getByRole("button", { name: "切换" }).click();
    await expect.element(screen.getByText("手动")).not.toBeInTheDocument();
  });

  it("renders the arrow and a node as the panel", async () => {
    const screen = await mount({ panel: <em>自定义内容</em> });
    await screen.getByRole("button", { name: "触发" }).click();
    await expect.element(screen.getByText("自定义内容")).toBeVisible();
    expect(screen.container.querySelector(".m-popover__arrow")).not.toBeNull();
  });

  it("does nothing when disabled", async () => {
    const onVisibleChange = vi.fn();
    const screen = await mount({ disabled: true, onVisibleChange });
    await screen.getByRole("button", { name: "触发" }).click();
    expect(onVisibleChange).not.toHaveBeenCalled();
    expect(screen.container.querySelector(".m-popover__float")).toBeNull();
  });
});
