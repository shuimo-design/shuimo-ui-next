import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MRate, type MRateProps } from ".";

/** 父组件真的把值写回去，连续按键 / 点击才能基于新值。断言和 Vue 那份逐字一致 */
function Host({ initial, ...rest }: { initial: number } & Partial<MRateProps>): ReactNode {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ padding: "40px" }}>
      <MRate {...rest} value={value} onValueChange={setValue} />
      <output data-testid="out">{String(value)}</output>
    </div>
  );
}

describe("MRate", () => {
  it("renders a radiogroup and sets the value on click", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host initial={0} onChange={onChange} />);
    const group = screen.getByRole("radiogroup");
    await expect.element(group).toHaveAttribute("aria-valuenow", "0");
    const radios = screen.getByRole("radio");
    expect(radios.all().length).toBe(5);

    await radios.nth(2).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("3");
    expect(onChange).toHaveBeenLastCalledWith(3);
    await expect.element(radios.nth(2)).toHaveAttribute("aria-checked", "true");
    await expect.element(radios.nth(3)).toHaveAttribute("aria-checked", "false");
    // 前三格满、后两格空
    const items = screen.container.querySelectorAll(".m-rate__item");
    expect(items[2]?.classList.contains("m-rate__item--full")).toBe(true);
    expect(items[3]?.classList.contains("m-rate__item--empty")).toBe(true);
  });

  it("clears when the current value is clicked again", async () => {
    const screen = await render(<Host initial={3} />);
    await screen.getByRole("radio").nth(2).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0");
  });

  it("keeps the value on a repeated click when allowClear is off", async () => {
    const screen = await render(<Host initial={3} allowClear={false} />);
    await screen.getByRole("radio").nth(2).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("3");
  });

  it("picks half a cell from the left side when allowHalf is on", async () => {
    const onHover = vi.fn();
    const screen = await render(<Host initial={0} allowHalf onHoverChange={onHover} />);
    const third = screen.getByRole("radio").nth(2);
    const rect = third.element().getBoundingClientRect();
    await third.hover({ position: { x: rect.width * 0.25, y: rect.height / 2 } });
    expect(onHover).toHaveBeenLastCalledWith(2.5);
    await third.click({ position: { x: rect.width * 0.25, y: rect.height / 2 } });
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2.5");
    const items = screen.container.querySelectorAll(".m-rate__item");
    expect(items[2]?.classList.contains("m-rate__item--half")).toBe(true);
    expect(items[2]?.querySelector(".m-rate__char--half")).not.toBeNull();
    // 半格也算选中了这一格
    await expect.element(third).toHaveAttribute("aria-checked", "true");

    // 指针离开后预览归零
    await page.elementLocator(screen.container).hover({ position: { x: 2, y: 2 } });
    expect(onHover).toHaveBeenLastCalledWith(0);
  });

  it("adjusts with the keyboard and keeps a single tab stop", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host initial={2} onChange={onChange} />);
    const radios = screen.getByRole("radio");
    const out = screen.getByTestId("out");
    // 只有当前值那一格进 Tab 序列
    await expect.element(radios.nth(1)).toHaveAttribute("tabindex", "0");
    await expect.element(radios.nth(0)).toHaveAttribute("tabindex", "-1");

    radios.nth(1).element().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(out).toHaveTextContent("3");
    expect(onChange).toHaveBeenLastCalledWith(3);
    // 焦点跟着停靠点走
    await vi.waitFor(() => expect(document.activeElement).toBe(radios.nth(2).element()));
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await expect.element(out).toHaveTextContent("1");
    await userEvent.keyboard("{End}");
    await expect.element(out).toHaveTextContent("5");
    // 到顶了再按不发 change
    const calls = onChange.mock.calls.length;
    await userEvent.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenCalledTimes(calls);
    await userEvent.keyboard("{Home}");
    await expect.element(out).toHaveTextContent("0");
  });

  it("steps by half with the keyboard when allowHalf is on", async () => {
    const screen = await render(<Host initial={1} allowHalf />);
    screen.getByRole("radio").nth(0).element().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("1.5");
  });

  it("does not respond when disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host initial={2} disabled onChange={onChange} />);
    const group = screen.getByRole("radiogroup");
    await expect.element(group).toHaveAttribute("aria-disabled", "true");
    const radios = screen.getByRole("radio");
    await expect.element(radios.nth(1)).toHaveAttribute("tabindex", "-1");
    // 组上有 aria-disabled，Playwright 认定格子不可点；这里是故意点禁用的东西，跳过可用性检查
    await radios.nth(3).click({ force: true });
    radios.nth(1).element().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not respond when readonly", async () => {
    const screen = await render(<Host initial={2} readonly />);
    await expect.element(screen.getByRole("radiogroup")).toHaveAttribute("aria-readonly", "true");
    await screen.getByRole("radio").nth(3).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2");
  });

  it("shows the text for the displayed value and names each cell after it", async () => {
    const texts = ["差", "一般", "还行", "不错", "很好"];
    const screen = await render(<MRate value={4} texts={texts} count={5} />);
    expect(screen.container.querySelector(".m-rate__text")?.textContent).toBe("不错");
    await expect
      .element(screen.getByRole("radio", { name: "还行" }))
      .toHaveAttribute("aria-checked", "false");
    await expect.element(screen.getByRole("radiogroup")).toHaveAttribute("aria-valuetext", "不错");
  });

  it("renders a custom character with the scope and a blob mask per cell", async () => {
    const screen = await render(
      <MRate
        value={2}
        count={3}
        seed={7}
        renderCharacter={({ index, active }) => (
          <i className="custom" data-active={String(active)}>
            {index}
          </i>
        )}
      />,
    );
    const customs = screen.container.querySelectorAll<HTMLElement>(".custom");
    expect(customs.length).toBe(3);
    expect(customs[0]?.dataset.active).toBe("true");
    expect(customs[2]?.dataset.active).toBe("false");
    expect(customs[2]?.textContent).toBe("2");
    const items = screen.container.querySelectorAll<HTMLElement>(".m-rate__item");
    const masks = [...items].map((el) => el.style.getPropertyValue("--m-rate-mask"));
    expect(masks[0]).toMatch(/^url\("data:image\/svg/);
    expect(new Set(masks).size).toBe(3);
  });
});
