import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MButton } from ".";

describe("MButton", () => {
  it("renders slot text and emits click", async () => {
    const onClick = vi.fn();
    const screen = await render(MButton, {
      props: { onClick },
      slots: { default: () => "落墨" },
    });
    const button = screen.getByRole("button", { name: "落墨" });
    await expect.element(button).toBeVisible();
    await button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not emit when disabled", async () => {
    const onClick = vi.fn();
    const screen = await render(MButton, {
      props: { disabled: true, onClick },
      slots: { default: () => "禁用" },
    });
    const button = screen.getByRole("button", { name: "禁用" });
    await expect.element(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders as a link when href is given", async () => {
    const screen = await render(MButton, {
      props: { href: "https://shuimo.design" },
      slots: { default: () => "链接" },
    });
    await expect
      .element(screen.getByRole("link", { name: "链接" }))
      .toHaveAttribute("href", "https://shuimo.design");
  });
});
