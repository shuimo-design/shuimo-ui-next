import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MCheckbox, MCheckboxGroup, type CheckboxValue } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

describe("MCheckbox", () => {
  it("toggles v-model on click", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MCheckbox, {
      props: { modelValue: false, label: "留白", "onUpdate:modelValue": onUpdate, onChange },
    });
    await screen.getByRole("checkbox", { name: "留白" }).click();
    expect(onUpdate).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(true, expect.any(Event));
  });

  it("does not toggle when disabled", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MCheckbox, {
      props: { modelValue: false, label: "禁", disabled: true, "onUpdate:modelValue": onUpdate },
    });
    const box = screen.getByRole("checkbox", { name: "禁" });
    await expect.element(box).toBeDisabled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("renders a numeric label", async () => {
    const screen = await render(MCheckbox, { props: { modelValue: false, label: 2024 } });
    await expect.element(screen.getByRole("checkbox", { name: "2024" })).toBeVisible();
  });

  it("swaps the box for a brush border and the mark for an ink mask under m-ink-ready", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(MCheckbox, { props: { modelValue: true, label: "墨" } });
    const box = screen.container.querySelector<HTMLElement>(".m-checkbox__box")!;
    await expect.poll(() => box.hasAttribute("data-ink-stroke")).toBe(true);
    await expect
      .poll(() => getComputedStyle(box).getPropertyValue("--m-ink-stroke-border"))
      .toContain("data:image/svg+xml");
    const root = screen.container.querySelector<HTMLElement>(".m-checkbox")!;
    expect(root.style.getPropertyValue("--m-checkbox-mark-mask")).toContain("data:image/svg+xml");
    expect(root.style.getPropertyValue("--m-checkbox-bar-mask")).toContain("data:image/svg+xml");
    const mark = screen.container.querySelector<HTMLElement>(".m-checkbox__mark")!;
    expect(getComputedStyle(mark).maskImage).toContain("data:image/svg+xml");
  });

  it("exposes indeterminate as aria-checked=mixed", async () => {
    const screen = await render(MCheckbox, {
      props: { modelValue: false, label: "半", indeterminate: true },
    });
    await expect
      .element(screen.getByRole("checkbox", { name: "半" }))
      .toHaveAttribute("aria-checked", "mixed");
  });
});

describe("MCheckboxGroup", () => {
  const Group = defineComponent({
    props: { max: { type: Number, required: false } },
    setup(props) {
      const values = ref<CheckboxValue[]>(["shan"]);
      return () =>
        h(
          MCheckboxGroup,
          {
            modelValue: values.value,
            ...(props.max === undefined ? {} : { max: props.max }),
            "onUpdate:modelValue": (v: CheckboxValue[]) => (values.value = v),
          },
          {
            default: () => [
              h(MCheckbox, { value: "shan", label: "山" }),
              h(MCheckbox, { value: "shui", label: "水" }),
              h(MCheckbox, { value: "yun", label: "云" }),
              h("output", { "data-testid": "out" }, values.value.join(",")),
            ],
          },
        );
    },
  });

  it("collects values from children", async () => {
    const screen = await render(Group);
    await expect.element(screen.getByRole("checkbox", { name: "山" })).toBeChecked();
    await screen.getByRole("checkbox", { name: "水" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan,shui");
    await screen.getByRole("checkbox", { name: "山" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
  });

  it("locks unchecked items when max is reached", async () => {
    const screen = await render(Group, { props: { max: 2 } });
    await screen.getByRole("checkbox", { name: "水" }).click();
    await expect.element(screen.getByRole("checkbox", { name: "云" })).toBeDisabled();
    await expect.element(screen.getByRole("checkbox", { name: "山" })).not.toBeDisabled();
  });
});
