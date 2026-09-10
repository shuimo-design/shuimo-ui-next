import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MDeleteIcon } from ".";

describe("MDeleteIcon", () => {
  it("renders the brush and emits click", async () => {
    const onClick = vi.fn();
    const screen = await render(MDeleteIcon, { props: { size: 24, onClick } });
    const button = screen.getByRole("button", { name: "删除" });
    expect(screen.container.querySelector(".m-delete-icon__brush")).not.toBeNull();
    expect((button.element() as HTMLElement).style.getPropertyValue("--m-delete-icon-size")).toBe(
      "24px",
    );
    await button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it("renders the cross variant with its own mask variable", async () => {
    const screen = await render(MDeleteIcon, { props: { kind: "cross", label: "移除" } });
    const button = screen.getByRole("button", { name: "移除" });
    expect(screen.container.querySelector(".m-delete-icon__cross")).not.toBeNull();
    expect(
      (button.element() as HTMLElement).style.getPropertyValue("--m-delete-icon-cross"),
    ).toContain("data:image/svg+xml");
  });

  it("does not emit when disabled", async () => {
    const onClick = vi.fn();
    const screen = await render(MDeleteIcon, { props: { disabled: true, onClick } });
    const button = screen.getByRole("button");
    await expect.element(button).toBeDisabled();
    // 禁用的按钮 click() 会被挡住，换成派发事件直接验证处理函数的守卫
    button.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
