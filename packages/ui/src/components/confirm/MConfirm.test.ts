import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MConfirm, useConfirm } from ".";

describe("MConfirm", () => {
  afterEach(async () => {
    await vi.waitFor(() => {
      expect(document.querySelectorAll(".m-confirm")).toHaveLength(0);
    });
  });

  it("resolves true when the confirm button is clicked", async () => {
    const pending = MConfirm.show("确定要删吗");
    await expect.element(page.getByRole("alertdialog")).toHaveTextContent("确定要删吗");
    await page.getByRole("button", { name: "确定" }).click();
    await expect(pending).resolves.toBe(true);
  });

  it("resolves false on cancel and unmounts the host afterwards", async () => {
    const pending = useConfirm().show({ content: "取消试试", title: "提示" });
    await expect.element(page.getByRole("alertdialog", { name: "提示" })).toBeVisible();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(pending).resolves.toBe(false);
    await vi.waitFor(() => {
      expect(document.querySelector(".m-confirm-host")).toBeNull();
    });
  });

  it("works declaratively with v-model:open and emits confirm", async () => {
    const onUpdate = vi.fn();
    const onConfirm = vi.fn();
    const screen = await render(MConfirm, {
      props: {
        open: true,
        content: "君不见，黄河之水天上来",
        teleport: false,
        confirmText: "好",
        "onUpdate:open": onUpdate,
        onConfirm,
      },
    });
    await expect.element(screen.getByRole("alertdialog")).toHaveTextContent("黄河之水");
    await screen.getByRole("button", { name: "好" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(false);
    // 受控模式下由父级关掉
    await screen.rerender({ open: false });
  });

  it("cancels with Escape", async () => {
    const onCancel = vi.fn();
    await render(MConfirm, {
      props: { open: true, content: "按 Esc", teleport: false, onCancel },
    });
    await expect.element(page.getByRole("alertdialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("closes on mask click by default but not when clickClose is off", async () => {
    const onCancel = vi.fn();
    // 传了 onUpdate:open 就是受控模式：组件不会自己把 open 改成 false，方便连点两次
    const screen = await render(MConfirm, {
      props: {
        open: true,
        content: "点遮罩",
        teleport: false,
        mask: { clickClose: true },
        "onUpdate:open": vi.fn(),
        onCancel,
      },
    });
    screen.container.querySelector<HTMLElement>(".m-confirm")!.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    await screen.rerender({ mask: { clickClose: false } });
    screen.container.querySelector<HTMLElement>(".m-confirm")!.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    await screen.rerender({ open: false });
  });
});
