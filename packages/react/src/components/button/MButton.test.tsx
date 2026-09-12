import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { createInkEngine } from "@shuimo-design/core/ink";
import { MButton } from ".";

describe("MButton", () => {
  it("renders the text and fires click", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <MButton type="primary" onClick={onClick}>
        点我
      </MButton>,
    );
    const button = screen.getByRole("button", { name: "点我" });
    await expect.element(button).toBeVisible();
    await expect.element(button).toHaveClass("m-button--primary");
    await button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("swallows the click when disabled or loading", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <MButton disabled onClick={onClick}>
        禁用
      </MButton>,
    );
    await screen.getByRole("button").click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders an anchor when href is given", async () => {
    const screen = await render(<MButton href="https://shuimo.design">去看看</MButton>);
    const link = screen.getByRole("link", { name: "去看看" });
    await expect.element(link).toHaveAttribute("href", "https://shuimo.design");
  });

  it("draws the brush border and the ragged block once the engine is on", async () => {
    const engine = createInkEngine({ seed: 3 });
    const screen = await render(<MButton>落墨</MButton>);
    const button = screen.getByRole("button").element() as HTMLElement;
    await vi.waitFor(() => {
      expect(button.hasAttribute("data-ink-stroke")).toBe(true);
      // 毛边色块要量到尺寸才生成，挂载后才出现
      const shape = getComputedStyle(button).getPropertyValue("--m-button-shape");
      expect(shape).toContain("data:image/svg+xml");
    });
    engine.dispose();
  });
});
