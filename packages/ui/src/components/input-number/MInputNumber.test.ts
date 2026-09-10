import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, type PropType } from "vue";
import { MInputNumber } from ".";

/** 父组件真的把值写回去，按钮 / 键盘连续操作才能基于新值 */
const Host = defineComponent({
  props: {
    initial: { type: Number, required: false },
    extra: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
  },
  setup(props) {
    const value = ref<number | undefined>(props.initial);
    return () =>
      h("div", [
        h(MInputNumber, {
          ...props.extra,
          modelValue: value.value,
          "onUpdate:modelValue": (v: number | undefined) => (value.value = v),
        }),
        h("output", { "data-testid": "out" }, String(value.value)),
      ]);
  },
});

describe("MInputNumber", () => {
  it("steps with the buttons and clamps to min/max", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, {
      props: { initial: 1, extra: { min: 0, max: 2, onChange } },
    });
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
    const screen = await render(Host, { props: { extra: { onChange, onInput } } });
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
    const screen = await render(Host, { props: { initial: 5 } });
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
    const screen = await render(Host, { props: { extra: { precision: 2 } } });
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
    const screen = await render(Host, { props: { initial: 0.1, extra: { step: 0.2 } } });
    const input = screen.getByRole("spinbutton");
    input.element().focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0.3");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("-0.1");
  });

  it("is disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, {
      props: { initial: 1, extra: { disabled: true, onChange } },
    });
    await expect.element(screen.getByRole("spinbutton")).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "增加" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "减少" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides the controls and passes native attrs to the input", async () => {
    const screen = await render(MInputNumber, {
      props: { modelValue: 1, controls: false, "data-testid": "num", class: "outer" },
    });
    expect(screen.container.querySelectorAll("button")).toHaveLength(0);
    const input = screen.getByTestId("num");
    await expect.element(input).toHaveAttribute("role", "spinbutton");
    expect(screen.container.querySelector(".m-input-number")?.classList.contains("outer")).toBe(
      true,
    );
  });

  it("readonly ignores buttons and arrow keys", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, {
      props: { initial: 4, extra: { readonly: true, onChange } },
    });
    const input = screen.getByRole("spinbutton");
    await expect.element(input).toHaveAttribute("readonly");
    await expect.element(screen.getByRole("button", { name: "增加" })).toBeDisabled();
    input.element().focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("4");
    expect(onChange).not.toHaveBeenCalled();
  });
});
