import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MInputNumber, type MInputNumberProps } from ".";

/** 父组件真的把值写回去，按钮 / 键盘连续操作才能基于新值 */
function Host({ initial, ...extra }: { initial?: number } & Partial<MInputNumberProps>) {
  const [value, setValue] = useState<number | undefined>(initial);
  return (
    <div>
      <MInputNumber {...extra} value={value} onValueChange={setValue} />
      <output data-testid="out">{String(value)}</output>
    </div>
  );
}

describe("MInputNumber", () => {
  it("steps with the buttons and clamps to min/max", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host initial={1} min={0} max={2} onChange={onChange} />);
    const increase = screen.getByRole("button", { name: "增加" });
    const decrease = screen.getByRole("button", { name: "减少" });

    await increase.click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2");
    expect(onChange).toHaveBeenLastCalledWith(2, 1);
    await expect.element(increase).toBeDisabled();
    await expect.element(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", "2");

    await decrease.click();
    await decrease.click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0");
    await expect.element(decrease).toBeDisabled();
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("allows an unfinished decimal while typing and cleans it up on blur", async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    const screen = await render(<Host onChange={onChange} onInput={onInput} />);
    const input = screen.getByRole("spinbutton");

    await input.fill("1.");
    expect(onInput).toHaveBeenLastCalledWith("1.");
    await expect.element(input).toHaveValue("1.");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("undefined");

    input.element().blur();
    await expect.element(input).toHaveValue("1");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("1");
    expect(onChange).toHaveBeenCalledWith(1, undefined);
  });

  it("pads a leading dot, strips leading zeros and falls back on garbage", async () => {
    const screen = await render(<Host initial={5} />);
    const input = screen.getByRole("spinbutton");

    await input.fill(".5");
    await expect.element(input).toHaveValue("0.5");
    await input.fill("007");
    await expect.element(input).toHaveValue("7");
    await input.fill("-");
    input.element().blur();
    // 孤立的 `-` 等于清空
    await expect.element(input).toHaveValue("");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("undefined");
  });

  it("truncates to precision", async () => {
    const screen = await render(<Host precision={2} />);
    const input = screen.getByRole("spinbutton");
    await input.fill("3.14159");
    await expect.element(input).toHaveValue("3.14");
    input.element().blur();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("3.14");
    await screen.getByRole("button", { name: "增加" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("4.14");
    await expect.element(input).toHaveValue("4.14");
  });

  it("steps with arrow keys without float drift", async () => {
    const screen = await render(<Host initial={0.1} step={0.2} />);
    const input = screen.getByRole("spinbutton");
    input.element().focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0.3");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("-0.1");
  });

  it("is disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host initial={1} disabled onChange={onChange} />);
    await expect.element(screen.getByRole("spinbutton")).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "增加" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "减少" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides the controls and passes native attrs to the input", async () => {
    const screen = await render(
      <MInputNumber value={1} controls={false} data-testid="num" className="outer" />,
    );
    expect(screen.container.querySelectorAll("button")).toHaveLength(0);
    const input = screen.getByTestId("num");
    await expect.element(input).toHaveAttribute("role", "spinbutton");
    expect(screen.container.querySelector(".m-input-number")?.classList.contains("outer")).toBe(
      true,
    );
  });

  it("readonly ignores buttons and arrow keys", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host initial={4} readonly onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    await expect.element(input).toHaveAttribute("readonly");
    await expect.element(screen.getByRole("button", { name: "增加" })).toBeDisabled();
    input.element().focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("4");
    expect(onChange).not.toHaveBeenCalled();
  });
});
