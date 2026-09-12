import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MInput } from ".";

describe("MInput", () => {
  it("updates the bound value while typing and emits change on commit", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(
      <MInput placeholder="题字" onValueChange={onUpdate} onChange={onChange} />,
    );
    const input = screen.getByPlaceholder("题字");
    await input.fill("山色有无中");
    expect(onUpdate).toHaveBeenLastCalledWith("山色有无中");
    await screen.getByPlaceholder("题字").element().blur();
    expect(onChange).toHaveBeenCalledWith("山色有无中");
  });

  it("clears with the clear button", async () => {
    const onUpdate = vi.fn();
    const onClear = vi.fn();
    const screen = await render(
      <MInput defaultValue="江流天地外" clearable onValueChange={onUpdate} onClear={onClear} />,
    );
    await screen.getByRole("button", { name: "清空" }).click();
    expect(onUpdate).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("toggles password visibility", async () => {
    const screen = await render(<MInput defaultValue="secret" type="password" showPassword />);
    const native = screen.container.querySelector("input")!;
    expect(native.type).toBe("password");
    await screen.getByRole("button", { name: "显示密码" }).click();
    expect(native.type).toBe("text");
  });

  it("is disabled", async () => {
    const screen = await render(<MInput defaultValue="" disabled placeholder="x" />);
    await expect.element(screen.getByPlaceholder("x")).toBeDisabled();
  });

  it("renders a textarea", async () => {
    const screen = await render(
      <MInput defaultValue="" type="textarea" rows={4} placeholder="t" />,
    );
    const textarea = screen.container.querySelector("textarea")!;
    expect(textarea.rows).toBe(4);
  });

  it("shows a character count with the limit", async () => {
    const screen = await render(<MInput defaultValue="山色有" maxlength={10} showCount />);
    await expect.element(screen.getByText("3 / 10")).toBeVisible();
    await screen.getByRole("textbox").fill("山色有无中");
    await expect.element(screen.getByText("5 / 10")).toBeVisible();
  });

  it("renders prefix and suffix slots", async () => {
    const screen = await render(<MInput defaultValue="" prefix="￥" suffix="元" />);
    await expect.element(screen.getByText("￥")).toBeVisible();
    await expect.element(screen.getByText("元")).toBeVisible();
  });

  it("readonly keeps the value and hides the clear button", async () => {
    const onUpdate = vi.fn();
    const screen = await render(
      <MInput defaultValue="只读" readonly clearable onValueChange={onUpdate} />,
    );
    await expect.element(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(screen.container.querySelector(".m-input__action")).toBeNull();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("applies maxlength and resize to the textarea", async () => {
    const screen = await render(
      <MInput defaultValue="" type="textarea" maxlength={8} resize="none" />,
    );
    const textarea = screen.container.querySelector("textarea")!;
    expect(textarea.maxLength).toBe(8);
    expect(getComputedStyle(textarea).resize).toBe("none");
  });
});
