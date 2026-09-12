import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MLoading } from ".";

describe("MLoading", () => {
  it("renders the ink-dot spinner with speed and size as CSS variables", async () => {
    const screen = await render(<MLoading speed={800} size={64} />);
    const root = screen.getByRole("status");
    await expect.element(root).toHaveAttribute("aria-label", "加载中");
    const el = root.element() as HTMLElement;
    expect(el.style.getPropertyValue("--m-loading-speed")).toBe("800ms");
    expect(el.style.getPropertyValue("--m-loading-size")).toBe("64px");
    expect(el.querySelectorAll(".m-loading__spinner polygon").length).toBe(8);
    expect(el.classList.contains("m-loading--mask")).toBe(false);
  });

  it("shows text and the mask modifier", async () => {
    const screen = await render(<MLoading mask text="正在加载" />);
    await expect.element(screen.getByText("正在加载")).toBeVisible();
    expect(screen.getByRole("status").element().classList.contains("m-loading--mask")).toBe(true);
  });

  it("replaces the spinner with the indicator slot", async () => {
    const screen = await render(<MLoading indicator={<i className="custom-indicator" />} />);
    expect(screen.container.querySelector(".custom-indicator")).not.toBeNull();
    expect(screen.container.querySelector(".m-loading__spinner")).toBeNull();
  });
});
