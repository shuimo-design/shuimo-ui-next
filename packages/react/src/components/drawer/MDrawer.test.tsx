import { useState } from "react";
import { userEvent } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ensureInkFilters, type InkFiltersHandle } from "@shuimo-design/core/ink";
import { MDrawer, type DrawerDirection } from ".";

let filters: InkFiltersHandle;
beforeEach(() => {
  filters = ensureInkFilters();
});
afterEach(() => filters.dispose());

function Host(rest: Record<string, unknown>) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        打开
      </button>
      <MDrawer open={open} teleport={false} title="抽屉" onOpenChange={setOpen} {...rest}>
        <p>君不见，黄河之水天上来</p>
      </MDrawer>
    </div>
  );
}

// 每个用例只 render 一次：遮罩铺满全屏，留一个开着的抽屉会挡住后面用例的点击
describe("MDrawer", () => {
  it("slides in from the right by default, locks scroll and restores focus on close", async () => {
    const screen = await render(<Host />);
    const trigger = screen.getByRole("button", { name: "打开" });
    await trigger.click();
    const drawer = screen.getByRole("dialog");
    await expect.element(drawer).toBeVisible();
    const root = screen.container.querySelector<HTMLElement>(".m-drawer")!;
    expect(root.classList.contains("m-drawer--right")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");

    // 挂牌一直在摆，Playwright 等不到它"稳定"；人点得到，测试里跳过稳定性检查
    await screen.getByRole("button", { name: "关闭" }).click({ force: true });
    await vi.waitFor(() => expect(document.documentElement.style.overflow).toBe(""));
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element()));
  });

  it("puts the direction on the root class", async () => {
    const directions: DrawerDirection[] = ["top", "right", "bottom", "left"];
    const screen = await render(
      <div>
        {directions.map((direction) => (
          <MDrawer key={direction} open teleport={false} direction={direction} title={direction} />
        ))}
      </div>,
    );
    await vi.waitFor(() => {
      for (const direction of directions) {
        expect(screen.container.querySelector(`.m-drawer--${direction}`)).not.toBeNull();
      }
    });
  });

  it("closes on ESC and draws the four corner lattices", async () => {
    const screen = await render(<Host />);
    await screen.getByRole("button", { name: "打开" }).click();
    const root = screen.container.querySelector<HTMLElement>(".m-drawer")!;
    for (const corner of ["tl", "tr", "br", "bl"]) {
      expect(root.style.getPropertyValue(`--m-modal-lattice-${corner}`)).toContain(
        "data:image/svg+xml",
      );
    }
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(document.documentElement.style.overflow).toBe(""));
  });
});
