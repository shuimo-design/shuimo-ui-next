import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MCollapse, MCollapseItem, type CollapseName } from ".";

const Demo = defineComponent({
  props: {
    accordion: { type: Boolean, default: false },
    initial: { type: Array as () => CollapseName[], default: () => [] },
  },
  setup(props) {
    const active = ref<CollapseName | CollapseName[] | undefined>(
      props.accordion ? props.initial[0] : props.initial,
    );
    const text = () => {
      const v = active.value;
      if (v === undefined) return "";
      return Array.isArray(v) ? v.join(",") : String(v);
    };
    return () =>
      h("div", [
        h(
          MCollapse,
          {
            modelValue: active.value,
            accordion: props.accordion,
            "onUpdate:modelValue": (v: CollapseName | CollapseName[] | undefined) =>
              (active.value = v),
          },
          {
            default: () => [
              h(MCollapseItem, { name: "shan", title: "山" }, { default: () => "远山" }),
              h(MCollapseItem, { name: "shui", title: "水" }, { default: () => "流水" }),
              h(
                MCollapseItem,
                { name: "yun", title: "云", disabled: true },
                { default: () => "浮云" },
              ),
            ],
          },
        ),
        h("output", { "data-testid": "out" }, text()),
      ]);
  },
});

describe("MCollapse", () => {
  it("expands and collapses items through v-model", async () => {
    const screen = await render(Demo);
    const shan = screen.getByRole("button", { name: "山" });
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
    await shan.click();
    await expect.element(shan).toHaveAttribute("aria-expanded", "true");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
    await screen.getByRole("button", { name: "水" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan,shui");
    await shan.click();
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
  });

  it("emits change with the next active names", async () => {
    const onChange = vi.fn();
    const screen = await render(MCollapse, {
      props: { modelValue: [], onChange },
      slots: {
        default: () => [h(MCollapseItem, { name: 1, title: "一" }, { default: () => "壹" })],
      },
    });
    await screen.getByRole("button", { name: "一" }).click();
    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("keeps only one item open in accordion mode", async () => {
    const screen = await render(Demo, { props: { accordion: true, initial: ["shan"] } });
    const shan = screen.getByRole("button", { name: "山" });
    const shui = screen.getByRole("button", { name: "水" });
    await expect.element(shan).toHaveAttribute("aria-expanded", "true");
    await shui.click();
    await expect.element(shui).toHaveAttribute("aria-expanded", "true");
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await shui.click();
    await expect.element(shui).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("");
  });

  it("does not respond when the item is disabled", async () => {
    const screen = await render(Demo);
    const yun = screen.getByRole("button", { name: "云" });
    await expect.element(yun).toBeDisabled();
    await expect.element(yun).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("");
  });

  it("works standalone with a boolean v-model and emits change", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MCollapseItem, {
      props: { title: "庭院", modelValue: false, "onUpdate:modelValue": onUpdate, onChange },
      slots: { default: () => "乱红飞过秋千去" },
    });
    const header = screen.getByRole("button", { name: "庭院" });
    await expect.element(header).toHaveAttribute("aria-expanded", "false");
    await header.click();
    expect(onUpdate).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("draws the brush line after the title unless divider is off", async () => {
    const screen = await render(MCollapse, {
      props: { modelValue: [] },
      slots: {
        default: () => [
          h(MCollapseItem, { name: "a", title: "有线" }, { default: () => "壹" }),
          h(MCollapseItem, { name: "b", title: "无线", divider: false }, { default: () => "贰" }),
        ],
      },
    });
    const withLine = screen.getByRole("button", { name: "有线" }).element();
    const noLine = screen.getByRole("button", { name: "无线" }).element();
    const line = withLine.querySelector<HTMLElement>(".m-collapse-item__line");
    expect(line).not.toBeNull();
    // 线按剩余宽度单独生成，量出长度后会把遮罩写进自己的 CSS 变量
    await expect
      .poll(() => line && getComputedStyle(line).getPropertyValue("--m-brush-line-mask"))
      .toContain("url(");
    expect(noLine.querySelector(".m-collapse-item__line")).toBeNull();
  });

  it("disables every item when the group is disabled", async () => {
    const screen = await render(MCollapse, {
      props: { modelValue: [], disabled: true },
      slots: {
        default: () => [h(MCollapseItem, { name: "a", title: "甲" }, { default: () => "壹" })],
      },
    });
    await expect.element(screen.getByRole("button", { name: "甲" })).toBeDisabled();
  });

  it("hides collapsed content from the accessibility tree", async () => {
    const screen = await render(Demo, { props: { initial: ["shan"] } });
    await expect.element(screen.getByRole("region", { name: "山" })).toBeVisible();
    const content = screen.getByText("流水");
    expect(content.element().closest(".m-collapse-item__content")?.hasAttribute("inert")).toBe(
      true,
    );
  });
});
