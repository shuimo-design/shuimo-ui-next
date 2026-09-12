import { useState } from "react";
import { userEvent } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ensureInkFilters, type InkFiltersHandle } from "@shuimo-design/core/ink";
import { MDialog } from ".";

let filters: InkFiltersHandle;
beforeEach(() => {
  filters = ensureInkFilters();
});
afterEach(() => filters.dispose());

/** 带触发按钮的宿主：真实场景里弹窗都是从页面上某个按钮打开的 */
function Host({
  onOpenChange,
  ...rest
}: { onOpenChange?: (open: boolean) => void } & Record<string, unknown>) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        打开
      </button>
      <MDialog
        open={open}
        teleport={false}
        title="山水"
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        footer={<button type="button">确定</button>}
        {...rest}
      >
        <p>君不见，黄河之水天上来</p>
      </MDialog>
    </div>
  );
}

// 每个用例只 render 一次：遮罩铺满全屏，留一个开着的弹窗会把后面用例的点击全挡住，
// 而 vitest-browser-react 的自动清理是按用例来的
describe("MDialog", () => {
  it("opens from a trigger, locks scroll, moves focus in and hands it back", async () => {
    const screen = await render(<Host />);
    const trigger = screen.getByRole("button", { name: "打开" });
    await trigger.click();
    const dialog = screen.getByRole("dialog");
    await expect.element(dialog).toBeVisible();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.documentElement.style.overflow).toBe("hidden");
    await vi.waitFor(() => expect(dialog.element().contains(document.activeElement)).toBe(true));

    // 挂牌一直在摆（rotate 动画），Playwright 等不到它"稳定"；人点得到，测试里跳过稳定性检查
    await screen.getByRole("button", { name: "关闭" }).click({ force: true });
    await vi.waitFor(() => expect(document.documentElement.style.overflow).toBe(""));
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element()));
  });

  it("closes on ESC", async () => {
    const screen = await render(<Host />);
    await screen.getByRole("button", { name: "打开" }).click();
    expect(document.documentElement.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(document.documentElement.style.overflow).toBe(""));
  });

  it("keeps quiet when ESC and mask clicks are turned off", async () => {
    const screen = await render(<Host closeOnEsc={false} mask={{ clickClose: false }} />);
    await screen.getByRole("button", { name: "打开" }).click();
    await userEvent.keyboard("{Escape}");
    expect(document.documentElement.style.overflow).toBe("hidden");
    screen.container.querySelector<HTMLElement>(".m-dialog__mask")!.click();
    expect(document.documentElement.style.overflow).toBe("hidden");
  });

  it("draws the brush frame and the four corner lattices", async () => {
    const screen = await render(<Host />);
    await screen.getByRole("button", { name: "打开" }).click();
    const root = screen.container.querySelector<HTMLElement>(".m-dialog")!;
    for (const corner of ["tl", "tr", "br", "bl"]) {
      expect(root.style.getPropertyValue(`--m-modal-lattice-${corner}`)).toContain(
        "data:image/svg+xml",
      );
    }
    const panel = screen.container.querySelector<HTMLElement>(".m-dialog__panel")!;
    await vi.waitFor(() => expect(panel.hasAttribute("data-ink-stroke")).toBe(true));
  });

  it("gives each instance its own scene filter id so two dialogs never collide", async () => {
    const screen = await render(
      <div>
        <MDialog open teleport={false} title="甲" />
        <MDialog open teleport={false} title="乙" />
      </div>,
    );
    // 弹窗要等挂载后才渲染（服务端不渲染浮层），所以等一下再数
    await vi.waitFor(() => {
      const ids = [...screen.container.querySelectorAll(".m-dialog__scene svg [id]")].map(
        (el) => el.id,
      );
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
