import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MDatePicker } from ".";

describe("MDatePicker", () => {
  it("picks a day and writes the formatted string", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MDatePicker, {
      props: {
        modelValue: "2024-03-10",
        teleport: false,
        "onUpdate:modelValue": onUpdate,
        onChange,
      },
    });
    await screen.getByRole("button", { name: "2024-03-10" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await expect
      .element(screen.getByRole("gridcell", { name: "2024年3月10日" }))
      .toHaveAttribute("aria-selected", "true");
    await screen.getByRole("gridcell", { name: "2024年3月15日" }).click();
    expect(onUpdate).toHaveBeenCalledWith("2024-03-15");
    expect(onChange).toHaveBeenCalledWith("2024-03-15");
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders 42 cells and pads with neighbouring months", async () => {
    const screen = await render(MDatePicker, {
      props: { modelValue: "2024-02-10", teleport: false },
    });
    await screen.getByRole("button", { name: "2024-02-10" }).click();
    await expect.element(screen.getByRole("grid")).toBeVisible();
    expect(screen.container.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
    await expect
      .element(screen.getByRole("gridcell", { name: "2024年1月28日" }))
      .toHaveClass("m-date-picker__cell--outside");
    expect(screen.container.querySelector(".m-date-picker__weekdays")?.textContent).toBe(
      "日壹贰叁肆伍陆",
    );
  });

  it("honours disabledDate", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MDatePicker, {
      props: {
        modelValue: "2024-03-10",
        teleport: false,
        disabledDate: (date: Date) => date.getDate() === 15,
        "onUpdate:modelValue": onUpdate,
      },
    });
    await screen.getByRole("button", { name: "2024-03-10" }).click();
    const cell = screen.getByRole("gridcell", { name: "2024年3月15日" });
    await expect.element(cell).toBeDisabled();
    await expect.element(cell).toHaveClass("m-date-picker__cell--disabled");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("navigates months and years from the header", async () => {
    const screen = await render(MDatePicker, {
      props: { modelValue: "2024-03-10", teleport: false },
    });
    await screen.getByRole("button", { name: "2024-03-10" }).click();
    await screen.getByRole("button", { name: "下一月" }).click();
    await expect.element(screen.getByRole("button", { name: "4月" })).toBeVisible();
    await screen.getByRole("button", { name: "上一年" }).click();
    await expect.element(screen.getByRole("button", { name: "2023年" })).toBeVisible();
    // 点年进年面板，再选年回到月面板
    await screen.getByRole("button", { name: "2023年" }).click();
    await screen.getByRole("gridcell", { name: "2020年" }).click();
    await screen.getByRole("gridcell", { name: "2020年六月" }).click();
    await expect.element(screen.getByRole("button", { name: "2020年" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "6月" })).toBeVisible();
  });

  it("returns YYYY-MM for type=month", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MDatePicker, {
      props: {
        modelValue: "2024-01",
        type: "month",
        teleport: false,
        "onUpdate:modelValue": onUpdate,
      },
    });
    await screen.getByRole("button", { name: "2024-01" }).click();
    await screen.getByRole("gridcell", { name: "2024年三月" }).click();
    expect(onUpdate).toHaveBeenCalledWith("2024-03");
  });

  it("moves focus with arrow keys and picks with Enter", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MDatePicker, {
      props: { modelValue: "2024-03-10", teleport: false, "onUpdate:modelValue": onUpdate },
    });
    await screen.getByRole("button", { name: "2024-03-10" }).click();
    await expect.element(screen.getByRole("gridcell", { name: "2024年3月10日" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    await expect.element(screen.getByRole("gridcell", { name: "2024年3月18日" })).toHaveFocus();
    await userEvent.keyboard("{PageDown}");
    await expect.element(screen.getByRole("gridcell", { name: "2024年4月18日" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onUpdate).toHaveBeenCalledWith("2024-04-18");
  });

  it("closes with Escape and clears with the clear button", async () => {
    const onUpdate = vi.fn();
    const onClear = vi.fn();
    const onVisibleChange = vi.fn();
    const screen = await render(MDatePicker, {
      props: {
        modelValue: "2024-03-10",
        teleport: false,
        "onUpdate:modelValue": onUpdate,
        onClear,
        onVisibleChange,
      },
    });
    await screen.getByRole("button", { name: "2024-03-10" }).click();
    await userEvent.keyboard("{Escape}");
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "清空" }).click();
    expect(onUpdate).toHaveBeenCalledWith(null);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("does not open when disabled", async () => {
    const onVisibleChange = vi.fn();
    const screen = await render(MDatePicker, {
      props: { disabled: true, teleport: false, onVisibleChange },
    });
    await expect.element(screen.getByRole("button", { name: "请选择日期" })).toBeDisabled();
    expect(onVisibleChange).not.toHaveBeenCalled();
  });
});

describe("MDatePicker · 旧版兼容", () => {
  it("accepts a Date object and writes back a formatted string", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MDatePicker, {
      props: {
        modelValue: new Date(2024, 2, 10, 15, 30),
        teleport: false,
        "onUpdate:modelValue": onUpdate,
      },
    });
    await screen.getByRole("button", { name: "2024-03-10" }).click();
    await expect
      .element(screen.getByRole("gridcell", { name: "2024年3月10日" }))
      .toHaveAttribute("aria-selected", "true");
    await screen.getByRole("gridcell", { name: "2024年3月12日" }).click();
    expect(onUpdate).toHaveBeenCalledWith("2024-03-12");
  });

  it("lays months out 4 per row and marks the selected one", async () => {
    const screen = await render(MDatePicker, {
      props: { modelValue: "2024-09", type: "month", teleport: false },
    });
    await screen.getByRole("button", { name: "2024-09" }).click();
    expect(screen.container.querySelectorAll('[role="row"]')).toHaveLength(3);
    expect(screen.container.querySelectorAll('[role="gridcell"]')).toHaveLength(12);
    await expect
      .element(screen.getByRole("gridcell", { name: "2024年九月" }))
      .toHaveClass("m-date-picker__cell--selected");
    // 头部分割线和翻年箭头都在
    expect(screen.container.querySelector(".m-date-picker__divider")).not.toBeNull();
    await expect.element(screen.getByRole("button", { name: "上一年" })).toBeVisible();
  });

  it("marks today and keeps the weekday row bold text", async () => {
    const now = new Date();
    const screen = await render(MDatePicker, { props: { teleport: false } });
    await screen.getByRole("button", { name: "请选择日期" }).click();
    const label = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    await expect
      .element(screen.getByRole("gridcell", { name: label }))
      .toHaveClass("m-date-picker__cell--today");
  });
});
