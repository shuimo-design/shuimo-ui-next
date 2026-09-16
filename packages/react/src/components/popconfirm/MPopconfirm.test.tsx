import { useState } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MPopconfirm, type MPopconfirmProps } from ".";

function mount(props: Partial<MPopconfirmProps> = {}) {
  return render(
    <MPopconfirm teleport={false} title="确定删除这一项？" {...props}>
      <button type="button">删除</button>
    </MPopconfirm>,
  );
}

/** 气泡旁边放一个无关按钮，用来点「外面」 */
function OutsideHost({ onCancel }: { onCancel?: () => void }) {
  return (
    <div>
      <MPopconfirm teleport={false} title="确定删除这一项？" onCancel={onCancel}>
        <button type="button">删除</button>
      </MPopconfirm>
      <button type="button">外面</button>
    </div>
  );
}

// 每个用例只 render 一次：查询是全页面的，渲染两次会撞 strict mode
describe("MPopconfirm", () => {
  it("opens on click, confirms and closes", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    const screen = await mount({ content: "删除后不可恢复", onConfirm, onCancel, onOpenChange });
    expect(screen.container.querySelector(".m-popconfirm__float")).toBeNull();

    const trigger = screen.getByRole("button", { name: "删除" });
    await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await trigger.click();
    const dialog = screen.getByRole("dialog", { name: "确定删除这一项？" });
    await expect.element(dialog).toBeVisible();
    await expect.element(screen.getByText("删除后不可恢复")).toBeVisible();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    // 徽记和墨尖都在
    expect(screen.container.querySelector(".m-popconfirm__icon")).not.toBeNull();
    expect(screen.container.querySelector(".m-popconfirm__arrow")).not.toBeNull();
    // 打开后焦点落在取消按钮上
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "取消" }).element()),
    );

    await screen.getByRole("button", { name: "确定" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await expect.element(dialog).not.toBeInTheDocument();
    // 焦点还给触发元素
    expect(document.activeElement).toBe(trigger.element());
  });

  it("cancels with the cancel button", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const screen = await mount({ onConfirm, onCancel, cancelText: "算了" });
    await screen.getByRole("button", { name: "删除" }).click();
    await screen.getByRole("button", { name: "算了" }).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("counts an outside click as cancel", async () => {
    const onCancel = vi.fn();
    const screen = await render(<OutsideHost onCancel={onCancel} />);
    await screen.getByRole("button", { name: "删除" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await screen.getByRole("button", { name: "外面" }).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Escape as cancel and restores focus", async () => {
    const onCancel = vi.fn();
    const screen = await mount({ onCancel });
    const trigger = screen.getByRole("button", { name: "删除" });
    await trigger.click();
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "取消" }).element()),
    );
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger.element());
  });

  it("does nothing when disabled", async () => {
    const onOpenChange = vi.fn();
    const screen = await mount({ disabled: true, onOpenChange });
    await screen.getByRole("button", { name: "删除" }).click();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.container.querySelector(".m-popconfirm__float")).toBeNull();
  });

  it("renders title / content render props, hides the icon and follows the open prop", async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <MPopconfirm
            teleport={false}
            title="标题"
            icon={false}
            open={open}
            onOpenChange={setOpen}
            renderTitle={() => <em>自定义标题</em>}
            renderContent={() => <i>自定义说明</i>}
          >
            <button type="button">删除</button>
          </MPopconfirm>
          <button type="button" onClick={() => setOpen((v) => !v)}>
            切换
          </button>
        </div>
      );
    }
    const screen = await render(<Host />);
    // 用键盘按「切换」：鼠标点它同时也算点到气泡外面，两边会互相抵消
    (screen.getByRole("button", { name: "切换" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByText("自定义标题")).toBeVisible();
    await expect.element(screen.getByText("自定义说明")).toBeVisible();
    expect(screen.container.querySelector(".m-popconfirm__icon")).toBeNull();
    // 焦点被送进了气泡，回到切换按钮再按一次
    (screen.getByRole("button", { name: "切换" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });
});
