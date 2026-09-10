import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { MDivider } from ".";

describe("MDivider", () => {
  it("renders a horizontal separator with a brush line sized to its width", async () => {
    const screen = await render(MDivider, { props: { thickness: 6 } });
    const root = screen.getByRole("separator");
    await expect.element(root).toHaveAttribute("aria-orientation", "horizontal");
    const line = screen.container.querySelector<HTMLElement>(".m-divider__line")!;
    // 等 ResizeObserver 报一次尺寸
    await expect
      .poll(() => getComputedStyle(line).getPropertyValue("--m-brush-line-mask"))
      .toContain("data:image/svg+xml");
    expect(line.style.getPropertyValue("--m-brush-line-band")).not.toBe("");
    expect((root.element() as HTMLElement).style.getPropertyValue("--m-divider-thickness")).toBe(
      "6px",
    );
  });

  it("renders vertical", async () => {
    const screen = await render(MDivider, { props: { vertical: true } });
    const root = screen.getByRole("separator");
    await expect.element(root).toHaveAttribute("aria-orientation", "vertical");
    expect(root.element().classList.contains("m-divider--vertical")).toBe(true);
  });

  it("renders text between two lines and honours align", async () => {
    const screen = await render(MDivider, { props: { text: "山水", align: "left" } });
    await expect.element(screen.getByText("山水")).toBeVisible();
    expect(screen.container.querySelectorAll(".m-divider__line").length).toBe(2);
    expect(screen.getByRole("separator").element().classList.contains("m-divider--left")).toBe(
      true,
    );
  });

  it("uses the default slot instead of text", async () => {
    const screen = await render(MDivider, { slots: { default: () => "题跋" } });
    await expect.element(screen.getByText("题跋")).toBeVisible();
  });
});
