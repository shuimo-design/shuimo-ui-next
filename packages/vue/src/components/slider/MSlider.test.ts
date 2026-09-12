import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, type PropType } from "vue";
import { MSlider, type SliderValue } from ".";

/** 父组件真的把值写回去，连续按键 / 拖动才能基于新值 */
const Host = defineComponent({
  props: {
    initial: { type: [Number, Array] as PropType<SliderValue>, required: true },
    extra: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
  },
  setup(props) {
    const value = ref<SliderValue>(props.initial);
    return () =>
      h("div", { style: "width: 400px; padding: 40px" }, [
        h(MSlider, {
          ...props.extra,
          modelValue: value.value,
          "onUpdate:modelValue": (v: SliderValue | undefined) => (value.value = v ?? 0),
        }),
        h("output", { "data-testid": "out" }, String(value.value)),
      ]);
  },
});

describe("MSlider", () => {
  it("adjusts with the keyboard", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, { props: { initial: 50, extra: { onChange } } });
    const thumb = screen.getByRole("slider");
    const out = screen.getByTestId("out");
    await expect.element(thumb).toHaveAttribute("aria-valuenow", "50");

    thumb.element().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(out).toHaveTextContent("51");
    expect(onChange).toHaveBeenLastCalledWith(51);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect.element(out).toHaveTextContent("49");
    await userEvent.keyboard("{PageUp}");
    await expect.element(out).toHaveTextContent("59");
    await userEvent.keyboard("{End}");
    await expect.element(out).toHaveTextContent("100");
    await expect.element(thumb).toHaveAttribute("aria-valuenow", "100");
    // 到顶了再按不发 change
    const calls = onChange.mock.calls.length;
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledTimes(calls);
    await userEvent.keyboard("{Home}");
    await expect.element(out).toHaveTextContent("0");
  });

  it("jumps to the clicked position on the rail", async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    const screen = await render(Host, {
      props: { initial: 0, extra: { onChange, onInput } },
    });
    const body = page.elementLocator(
      screen.container.querySelector<HTMLElement>(".m-slider__body")!,
    );
    const rect = body.element().getBoundingClientRect();
    // 珠子整个落在轨道里，行程是"轨道宽 - 珠子宽"，点在 25% 宽处对应的值要按这个行程折算
    const thumb = screen.getByRole("slider").element().getBoundingClientRect().width;
    const x = rect.width * 0.25;
    const expected = ((x - thumb / 2) / (rect.width - thumb)) * 100;
    await body.click({ position: { x, y: rect.height / 2 } });
    const value = Number(screen.getByTestId("out").element().textContent);
    expect(Math.abs(value - expected)).toBeLessThanOrEqual(1);
    expect(onInput).toHaveBeenCalledWith(value);
    expect(onChange).toHaveBeenCalledWith(value);
    await expect.element(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", `${value}`);
  });

  it("snaps to step and clamps", async () => {
    const screen = await render(Host, {
      props: { initial: 0, extra: { min: 0, max: 1, step: 0.25 } },
    });
    const thumb = screen.getByRole("slider");
    thumb.element().focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0.75");
    await userEvent.keyboard("{PageUp}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("1");
  });

  it("keeps range thumbs from crossing", async () => {
    const screen = await render(Host, { props: { initial: [30, 60], extra: { range: true } } });
    const start = screen.getByRole("slider", { name: "起点" });
    const end = screen.getByRole("slider", { name: "终点" });
    const out = screen.getByTestId("out");
    await expect.element(out).toHaveTextContent("30,60");

    start.element().focus();
    await userEvent.keyboard("{End}");
    await expect.element(out).toHaveTextContent("60,60");
    await expect.element(start).toHaveAttribute("aria-valuemax", "60");

    end.element().focus();
    await userEvent.keyboard("{Home}");
    await expect.element(out).toHaveTextContent("60,60");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(out).toHaveTextContent("60,61");
  });

  it("does not respond when disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, {
      props: { initial: 40, extra: { disabled: true, onChange } },
    });
    const thumb = screen.getByRole("slider");
    await expect.element(thumb).toHaveAttribute("tabindex", "-1");
    await expect.element(thumb).toHaveAttribute("aria-disabled", "true");

    thumb.element().focus();
    await userEvent.keyboard("{ArrowRight}");
    const body = page.elementLocator(
      screen.container.querySelector<HTMLElement>(".m-slider__body")!,
    );
    const rect = body.element().getBoundingClientRect();
    await body.click({ position: { x: rect.width * 0.9, y: rect.height / 2 } });
    await expect.element(screen.getByTestId("out")).toHaveTextContent("40");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows min, percent and max when showInfo is on", async () => {
    const screen = await render(MSlider, {
      props: { modelValue: 25, min: -50, max: 50, showInfo: true },
    });
    const info = screen.container.querySelector<HTMLElement>(".m-slider__info")!;
    expect(info.querySelector(".m-slider__min")?.textContent).toBe("-50");
    expect(info.querySelector(".m-slider__max")?.textContent).toBe("50");
    expect(info.querySelector(".m-slider__percent")?.textContent).toBe("75.00%");
    // 珠子不越出轨道：值在最大时右边贴着轨道右端
    const thumb = screen.getByRole("slider");
    await expect.element(thumb).toHaveAttribute("aria-valuenow", "25");
  });

  it("keeps the bead inside the rail at both ends", async () => {
    const screen = await render(Host, { props: { initial: 100 } });
    const body = screen.container.querySelector<HTMLElement>(".m-slider__body")!;
    const thumb = screen.getByRole("slider").element().getBoundingClientRect();
    const rail = body.getBoundingClientRect();
    expect(Math.abs(thumb.right - rail.right)).toBeLessThanOrEqual(1);
  });

  it("formats the tooltip", async () => {
    const screen = await render(MSlider, {
      props: { modelValue: 20, formatTooltip: (v: number) => `${v}%` },
    });
    const thumb = screen.getByRole("slider");
    await expect.element(thumb).toHaveAttribute("aria-valuetext", "20%");
    expect(screen.container.querySelector(".m-slider__tooltip")?.textContent?.trim()).toBe("20%");
  });
});
