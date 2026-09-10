import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MRadio, MRadioGroup, type RadioValue } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

describe("MRadio", () => {
  it("writes its value to v-model on click", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MRadio, {
      props: { value: "shan", label: "山", "onUpdate:modelValue": onUpdate, onChange },
    });
    const radio = screen.getByRole("radio", { name: "山" });
    await expect.element(radio).not.toBeChecked();
    await radio.click();
    expect(onUpdate).toHaveBeenCalledWith("shan");
    expect(onChange).toHaveBeenCalledWith("shan", expect.any(Event));
  });

  it("is checked when v-model equals its value", async () => {
    const screen = await render(MRadio, {
      props: { value: 1, modelValue: 1, label: "一" },
    });
    await expect.element(screen.getByRole("radio", { name: "一" })).toBeChecked();
  });

  it("renders a numeric label", async () => {
    const screen = await render(MRadio, { props: { value: 1, label: 1 } });
    await expect.element(screen.getByRole("radio", { name: "1" })).toBeVisible();
  });

  it("draws the ring and dot with ink masks under m-ink-ready", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(MRadio, { props: { value: "x", modelValue: "x", label: "墨" } });
    const root = screen.container.querySelector<HTMLElement>(".m-radio")!;
    expect(root.style.getPropertyValue("--m-radio-ring-mask")).toContain("data:image/svg+xml");
    expect(root.style.getPropertyValue("--m-radio-dot-mask")).toContain("data:image/svg+xml");
    const dot = screen.container.querySelector<HTMLElement>(".m-radio__dot")!;
    expect(getComputedStyle(dot, "::before").maskImage).toContain("data:image/svg+xml");
    expect(getComputedStyle(dot, "::after").maskImage).toContain("data:image/svg+xml");
  });

  it("does not respond when disabled", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MRadio, {
      props: { value: "x", label: "禁", disabled: true, "onUpdate:modelValue": onUpdate },
    });
    const radio = screen.getByRole("radio", { name: "禁" });
    await expect.element(radio).toBeDisabled();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe("MRadioGroup", () => {
  const Group = defineComponent({
    props: { disabled: { type: Boolean, default: false } },
    setup(props) {
      const value = ref<RadioValue>("shan");
      return () =>
        h(
          MRadioGroup,
          {
            modelValue: value.value,
            disabled: props.disabled,
            "onUpdate:modelValue": (v: RadioValue | undefined) => (value.value = v ?? ""),
          },
          {
            default: () => [
              h(MRadio, { value: "shan", label: "山" }),
              h(MRadio, { value: "shui", label: "水" }),
              h(MRadio, { value: "yun", label: "云" }),
              h("output", { "data-testid": "out" }, String(value.value)),
            ],
          },
        );
    },
  });

  it("keeps exactly one item checked", async () => {
    const screen = await render(Group);
    await expect.element(screen.getByRole("radiogroup")).toBeVisible();
    await expect.element(screen.getByRole("radio", { name: "山" })).toBeChecked();
    await screen.getByRole("radio", { name: "水" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await expect.element(screen.getByRole("radio", { name: "水" })).toBeChecked();
    await expect.element(screen.getByRole("radio", { name: "山" })).not.toBeChecked();
    await expect.element(screen.getByRole("radio", { name: "云" })).not.toBeChecked();
  });

  it("moves selection with arrow keys", async () => {
    const screen = await render(Group);
    await screen.getByRole("radio", { name: "山" }).click();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("yun");
  });

  it("disables every item when the group is disabled", async () => {
    const screen = await render(Group, { props: { disabled: true } });
    await expect.element(screen.getByRole("radio", { name: "水" })).toBeDisabled();
    await expect.element(screen.getByRole("radio", { name: "山" })).toBeChecked();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
  });
});
