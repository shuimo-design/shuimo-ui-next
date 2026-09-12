import { useState } from "react";
import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MOverlayOutlet } from "../overlay-outlet";
import { MConfirm } from ".";

describe("MConfirm", () => {
  afterEach(async () => {
    await vi.waitFor(() => {
      expect(document.querySelectorAll(".m-confirm")).toHaveLength(0);
    });
  });

  it("resolves true when the confirm button is clicked", async () => {
    await render(<MOverlayOutlet />);
    const pending = MConfirm.show("确定要删吗");
    await expect.element(page.getByRole("alertdialog")).toHaveTextContent("确定要删吗");
    await page.getByRole("button", { name: "确定" }).click();
    await expect(pending).resolves.toBe(true);
  });

  it("resolves false on cancel and takes the panel off the page afterwards", async () => {
    await render(<MOverlayOutlet />);
    const pending = MConfirm.show({ content: "取消试试", title: "提示" });
    await expect.element(page.getByRole("alertdialog", { name: "提示" })).toBeVisible();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(pending).resolves.toBe(false);
    await vi.waitFor(() => {
      expect(document.querySelector(".m-confirm")).toBeNull();
    });
  });

  it("works declaratively with the open prop and reports confirm", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <MConfirm
          open={open}
          content="君不见，黄河之水天上来"
          teleport={false}
          confirmText="好"
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
          onConfirm={onConfirm}
        />
      );
    }
    const screen = await render(<Host />);
    await expect.element(screen.getByRole("alertdialog")).toHaveTextContent("黄河之水");
    await screen.getByRole("button", { name: "好" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cancels with Escape", async () => {
    const onCancel = vi.fn();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <MConfirm
          open={open}
          content="按 Esc"
          teleport={false}
          onOpenChange={setOpen}
          onCancel={onCancel}
        />
      );
    }
    await render(<Host />);
    await expect.element(page.getByRole("alertdialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("closes on mask click by default but not when clickClose is off", async () => {
    const onCancel = vi.fn();
    // 受控且不改 open：组件不会自己关掉，方便连点两次
    const screen = await render(
      <MConfirm
        open
        content="点遮罩"
        teleport={false}
        mask={{ clickClose: true }}
        onOpenChange={() => {}}
        onCancel={onCancel}
      />,
    );
    screen.container.querySelector<HTMLElement>(".m-confirm")!.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    await screen.rerender(
      <MConfirm
        open
        content="点遮罩"
        teleport={false}
        mask={{ clickClose: false }}
        onOpenChange={() => {}}
        onCancel={onCancel}
      />,
    );
    screen.container.querySelector<HTMLElement>(".m-confirm")!.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    // 受控模式下由父级关掉，afterEach 才等得到它从页面上消失
    await screen.rerender(<MConfirm open={false} content="点遮罩" teleport={false} />);
  });
});
