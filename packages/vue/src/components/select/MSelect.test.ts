import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MSelect, type SelectOption, type SelectOptionLike, type SelectValue } from ".";

const options: SelectOption[] = [
  { label: "山", value: "shan" },
  { label: "水", value: "shui" },
  { label: "云", value: "yun", disabled: true },
  { label: "月", value: "yue" },
];

describe("MSelect", () => {
  it("opens on click and picks an option into v-model", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const onVisibleChange = vi.fn();
    const screen = await render(MSelect, {
      props: {
        options,
        teleport: false,
        "onUpdate:modelValue": onUpdate,
        onChange,
        onVisibleChange,
      },
    });
    await expect.element(screen.getByText("请选择")).toBeVisible();
    await screen.getByRole("combobox").click();
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await screen.getByRole("option", { name: "水" }).click();
    expect(onUpdate).toHaveBeenCalledWith("shui");
    expect(onChange).toHaveBeenCalledWith("shui");
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
  });

  it("adds and removes tags in multiple mode", async () => {
    const Host = defineComponent({
      setup() {
        const value = ref<SelectValue[]>(["shan"]);
        return () =>
          h("div", [
            h(MSelect, {
              options,
              multiple: true,
              teleport: false,
              modelValue: value.value,
              "onUpdate:modelValue": (next) => {
                value.value = Array.isArray(next) ? next : [];
              },
            }),
            h("output", { "data-testid": "out" }, value.value.join(",")),
          ]);
      },
    });
    const screen = await render(Host);
    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "水" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan,shui");
    // 多选点选项不收起
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await screen.getByRole("button", { name: "关闭" }).first().click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
  });

  it("filters options by typed text", async () => {
    const screen = await render(MSelect, {
      props: { options, filterable: true, teleport: false },
    });
    await screen.getByRole("combobox").click();
    await screen.getByRole("textbox").fill("水");
    await expect.element(screen.getByRole("option", { name: "水" })).toBeVisible();
    expect(screen.container.querySelectorAll('[role="option"]')).toHaveLength(1);
  });

  it("moves highlight with ArrowDown and picks with Enter", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MSelect, {
      props: { options, teleport: false, "onUpdate:modelValue": onUpdate },
    });
    await screen.getByRole("combobox").click();
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(screen.getByRole("option", { name: "水" }))
      .toHaveClass("m-select__option--active");
    // 云 是 disabled，要跳过它
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(screen.getByRole("option", { name: "月" }))
      .toHaveClass("m-select__option--active");
    await userEvent.keyboard("{Enter}");
    expect(onUpdate).toHaveBeenCalledWith("yue");
  });

  it("closes with Escape", async () => {
    const onVisibleChange = vi.fn();
    const screen = await render(MSelect, {
      props: { options, teleport: false, onVisibleChange },
    });
    await screen.getByRole("combobox").click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears with the clear button", async () => {
    const onUpdate = vi.fn();
    const onClear = vi.fn();
    const screen = await render(MSelect, {
      props: {
        options,
        modelValue: "shan",
        clearable: true,
        teleport: false,
        "onUpdate:modelValue": onUpdate,
        onClear,
      },
    });
    await screen.getByRole("button", { name: "清空" }).click();
    expect(onUpdate).toHaveBeenCalledWith(undefined);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("does not open when disabled", async () => {
    const onVisibleChange = vi.fn();
    const screen = await render(MSelect, {
      props: { options, disabled: true, teleport: false, onVisibleChange },
    });
    const trigger = screen.getByRole("combobox");
    await expect.element(trigger).toHaveAttribute("aria-disabled", "true");
    // aria-disabled 的元素 Playwright 默认拒绝点，强制点一下确认组件自己也不响应
    await trigger.click({ force: true });
    expect(onVisibleChange).not.toHaveBeenCalled();
    expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
  });
});

describe("MSelect · 旧版数据格式", () => {
  it("accepts primitive options and shows them as-is", async () => {
    const onUpdate = vi.fn();
    const onSelect = vi.fn();
    const screen = await render(MSelect, {
      props: {
        options: ["子", "丑", "寅"],
        modelValue: "子",
        teleport: false,
        "onUpdate:modelValue": onUpdate,
        onSelect,
      },
    });
    await expect.element(screen.getByText("子")).toBeVisible();
    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "子" }))
      .toHaveAttribute("aria-selected", "true");
    await screen.getByRole("option", { name: "丑" }).click();
    expect(onUpdate).toHaveBeenCalledWith("丑");
    expect(onSelect).toHaveBeenCalledWith("丑");
  });

  it("reads label / value / input text through optionParam, valueParam and inputParam", async () => {
    const options = [
      { before: "乾", after: "坎", number: "壹" },
      { before: "兑", after: "坤", number: "贰" },
    ];
    const onUpdate = vi.fn();
    const screen = await render(MSelect, {
      props: {
        options,
        modelValue: "贰",
        optionParam: "before",
        valueParam: "number",
        inputParam: "after",
        teleport: false,
        "onUpdate:modelValue": onUpdate,
      },
    });
    // 触发区显示 inputParam 字段
    await expect.element(screen.getByText("坤")).toBeVisible();
    await screen.getByRole("combobox").click();
    // 下拉显示 optionParam 字段，写回 valueParam 字段
    await screen.getByRole("option", { name: "乾" }).click();
    expect(onUpdate).toHaveBeenCalledWith("壹");
  });

  it("matches object values with toMatch", async () => {
    type Item = { name: string; element: string };
    const options: Item[] = [
      { name: "乾", element: "金" },
      { name: "离", element: "木" },
    ];
    const screen = await render(MSelect, {
      props: {
        options,
        optionParam: "name",
        modelValue: { name: "别的", element: "木" },
        toMatch: (option, value) => (option as Item).element === (value as Item).element,
        teleport: false,
      },
    });
    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "离" }))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("option", { name: "乾" }))
      .toHaveAttribute("aria-selected", "false");
  });

  it("passes the raw option and label to the option slot", async () => {
    const screen = await render(MSelect, {
      props: { options: [{ before: "乾", after: "坎" }], optionParam: "before", teleport: false },
      slots: {
        option: ({ option, label }: { option: SelectOptionLike; label: string }) =>
          `${label}→${(option as { after: string }).after}`,
      },
    });
    await screen.getByRole("combobox").click();
    await expect.element(screen.getByRole("option", { name: "乾→坎" })).toBeVisible();
  });

  it("emits input while typing and calls fetch when the list hits the bottom", async () => {
    const onInput = vi.fn();
    let resolveFetch: (() => void) | undefined;
    const fetch = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const screen = await render(MSelect, {
      props: {
        options: Array.from({ length: 30 }, (_, i) => `第${i + 1}项`),
        filterable: true,
        maxHeight: 120,
        fetch,
        teleport: false,
        onInput,
      },
    });
    await screen.getByRole("combobox").click();
    await screen.getByRole("textbox").fill("第");
    expect(onInput).toHaveBeenLastCalledWith("第");
    const list = screen.container.querySelector<HTMLElement>(".m-select__options")!;
    list.scrollTop = list.scrollHeight;
    list.dispatchEvent(new Event("scroll"));
    await expect.poll(() => screen.container.querySelector(".m-select__fetching")).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    // 拉取没结束前再滚也不重复发
    list.dispatchEvent(new Event("scroll"));
    expect(fetch).toHaveBeenCalledTimes(1);
    resolveFetch?.();
    await expect.poll(() => screen.container.querySelector(".m-select__fetching")).toBeNull();
    // 这次什么都没追加，列表高度没变，加载行消失引起的 scroll 不该再触发一次
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
