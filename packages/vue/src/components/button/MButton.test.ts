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

  it("falls back to the text prop when there is no slot", async () => {
    const screen = await render(MButton, { props: { text: "文字属性" } });
    await expect.element(screen.getByRole("button", { name: "文字属性" })).toBeVisible();
  });

  it("maps every type to its modifier class", async () => {
    for (const type of ["default", "primary", "confirm", "error", "warning", "text"] as const) {
      const screen = await render(MButton, {
        props: { type },
        slots: { default: () => type },
      });
      await expect
        .element(screen.getByRole("button", { name: type }))
        .toHaveClass(`m-button--${type}`);
    }
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

  it("shows a spinner and swallows clicks while loading", async () => {
    const onClick = vi.fn();
    const screen = await render(MButton, {
      props: { loading: true, onClick },
      slots: { default: () => "加载" },
    });
    const button = screen.getByRole("button", { name: "加载" });
    await expect.element(button).toHaveAttribute("aria-busy", "true");
    await expect.element(button).toHaveClass("m-button--loading");
    expect(button.element().querySelector(".m-button__spinner")).not.toBeNull();
    await button.click();
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

  it("blocks navigation on a disabled link", async () => {
    const onClick = vi.fn();
    const screen = await render(MButton, {
      props: { href: "#never", disabled: true, onClick },
      slots: { default: () => "禁用链接" },
    });
    const link = screen.getByRole("link", { name: "禁用链接" });
    await expect.element(link).toHaveAttribute("aria-disabled", "true");
    // aria-disabled 的链接被 playwright 当成"不可用"而拒绝点击，这里要的正是"点了也不跳"，强制点
    await link.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
    expect(location.hash).not.toBe("#never");
  });
});
