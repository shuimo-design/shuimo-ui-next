import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
// 尺寸断言要吃到 reset / tokens 层
import "../../style.css";
import { MProgress } from ".";

describe("MProgress", () => {
  it("exposes aria values and a trimmed percent text", async () => {
    const screen = await render(MProgress, { props: { value: 1, max: 3 } });
    const bar = screen.getByRole("progressbar");
    await expect.element(bar).toHaveAttribute("aria-valuenow", "1");
    await expect.element(bar).toHaveAttribute("aria-valuemin", "0");
    await expect.element(bar).toHaveAttribute("aria-valuemax", "3");
    await expect.element(bar).toHaveTextContent("33.33%");
    const fill = screen.container.querySelector<HTMLElement>(".m-progress__bar")!;
    expect(fill.style.width).toBe("33.33%");
  });

  it("drops trailing zeros and clamps out-of-range values", async () => {
    const screen = await render(MProgress, { props: { value: 250, max: 100, status: "success" } });
    const bar = screen.getByRole("progressbar");
    await expect.element(bar).toHaveAttribute("aria-valuenow", "100");
    await expect.element(bar).toHaveTextContent("100%");
    expect(bar.element().classList.contains("m-progress--success")).toBe(true);
    expect(bar.element().classList.contains("m-progress--done")).toBe(true);
  });

  it("renders the default slot with percent instead of the text", async () => {
    const screen = await render(MProgress, {
      props: { value: 42.5, strokeWidth: 12 },
      slots: { default: ({ percent }: { percent: number }) => `已完成 ${percent}` },
    });
    const bar = screen.getByRole("progressbar");
    await expect.element(bar).toHaveTextContent("已完成 42.5");
    expect(bar.element().textContent).not.toContain("%");
    expect((bar.element() as HTMLElement).style.getPropertyValue("--m-progress-h")).toBe("12px");
  });

  it("overlays the info on the bar and keeps the old 187×17 default size", async () => {
    const screen = await render(MProgress, { props: { value: 20 } });
    const root = screen.getByRole("progressbar").element().getBoundingClientRect();
    const info = screen.container
      .querySelector<HTMLElement>(".m-progress__info")!
      .getBoundingClientRect();
    expect(Math.round(root.width)).toBe(187);
    expect(Math.round(root.height)).toBe(17);
    // 文字落在框里居中，而不是排在条的右边
    expect(info.left).toBeGreaterThan(root.left);
    expect(info.right).toBeLessThan(root.right);
    expect(
      Math.abs((info.left + info.right) / 2 - (root.left + root.right) / 2),
    ).toBeLessThanOrEqual(2);
  });

  it("hides the info when showInfo is false", async () => {
    const screen = await render(MProgress, { props: { value: 10, showInfo: false } });
    expect(screen.container.querySelector(".m-progress__info")).toBeNull();
  });
});
