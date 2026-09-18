import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MAutoComplete, type AutoCompleteOption } from ".";

const options: AutoCompleteOption[] = [
  { value: "shan", label: "山" },
  { value: "shui", label: "水" },
  { value: "shuo", label: "朔", disabled: true },
  { value: "yue", label: "月" },
];

describe("MAutoComplete", () => {
  it("filters while typing and writes the picked option into v-model", async () => {
    const onUpdate = vi.fn();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    const screen = await render(MAutoComplete, {
      props: {
        options,
        placeholder: "找",
        teleport: false,
        "onUpdate:modelValue": onUpdate,
        onSearch,
        onSelect,
      },
    });
    const input = screen.getByRole("combobox");
    await input.fill("sh");
    expect(onUpdate).toHaveBeenLastCalledWith("sh");
    expect(onSearch).toHaveBeenLastCalledWith("sh");
    await expect.element(input).toHaveAttribute("aria-expanded", "true");
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    expect(screen.container.querySelectorAll('[role="option"]')).toHaveLength(3);
    await screen.getByRole("option", { name: "水" }).click();
    expect(onUpdate).toHaveBeenLastCalledWith("shui");
    expect(onSelect).toHaveBeenCalledWith(options[1]);
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    await expect.element(input).toHaveAttribute("aria-expanded", "false");
  });

  it("moves highlight with ArrowDown, skipping disabled, and picks with Enter", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MAutoComplete, {
      props: { options, teleport: false, "onUpdate:modelValue": onUpdate },
    });
    const input = screen.getByRole("combobox");
    await input.fill("sh");
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(screen.getByRole("option", { name: "山" }))
      .toHaveClass("m-auto-complete__option--active");
    await expect
      .element(input)
      .toHaveAttribute(
        "aria-activedescendant",
        screen.getByRole("option", { name: "山" }).element().id,
      );
    await userEvent.keyboard("{ArrowDown}");
    // 朔 是 disabled，要跳过它
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(screen.getByRole("option", { name: "山" }))
      .toHaveClass("m-auto-complete__option--active");
    await userEvent.keyboard("{ArrowUp}");
    await expect
      .element(screen.getByRole("option", { name: "水" }))
      .toHaveClass("m-auto-complete__option--active");
    await userEvent.keyboard("{Enter}");
    expect(onUpdate).toHaveBeenLastCalledWith("shui");
  });

  it("closes with Escape and re-opens on the next keystroke", async () => {
    const screen = await render(MAutoComplete, { props: { options, teleport: false } });
    const input = screen.getByRole("combobox");
    await input.fill("s");
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    await input.fill("sh");
    await expect.element(screen.getByRole("listbox")).toBeVisible();
  });

  it("shows the empty text when nothing matches, and nothing without one", async () => {
    const screen = await render(MAutoComplete, {
      props: { options, emptyText: "无匹配", teleport: false },
    });
    await screen.getByRole("combobox").fill("zzz");
    await expect.element(screen.getByText("无匹配")).toBeVisible();
    await screen.rerender({ emptyText: "" });
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
  });

  it("leaves filtering to the caller when filter is false", async () => {
    const Host = defineComponent({
      setup() {
        const list = ref<AutoCompleteOption[]>([]);
        const value = ref("");
        return () =>
          h(MAutoComplete, {
            options: list.value,
            filter: false,
            teleport: false,
            modelValue: value.value,
            "onUpdate:modelValue": (next: string) => (value.value = next),
            onSearch: (input: string) => {
              list.value = input ? [{ value: `${input}-1` }, { value: `${input}-2` }] : [];
            },
          });
      },
    });
    const screen = await render(Host);
    await screen.getByRole("combobox").fill("ab");
    await expect.element(screen.getByRole("option", { name: "ab-1" })).toBeVisible();
    expect(screen.container.querySelectorAll('[role="option"]')).toHaveLength(2);
  });

  it("debounces search", async () => {
    const onSearch = vi.fn();
    const screen = await render(MAutoComplete, {
      props: { options, debounce: 80, teleport: false, onSearch },
    });
    await screen.getByRole("combobox").fill("sh");
    expect(onSearch).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(onSearch).toHaveBeenCalledWith("sh"));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("clears with the clear button", async () => {
    const onUpdate = vi.fn();
    const onClear = vi.fn();
    const screen = await render(MAutoComplete, {
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
    expect(onUpdate).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("passes option and active to the option slot", async () => {
    const screen = await render(MAutoComplete, {
      props: { options, teleport: false },
      slots: {
        option: ({ option, active }: { option: AutoCompleteOption; active: boolean }) =>
          `${option.label}/${active ? "on" : "off"}`,
      },
    });
    await screen.getByRole("combobox").fill("yu");
    await expect.element(screen.getByRole("option", { name: "月/off" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("option", { name: "月/on" })).toBeVisible();
  });

  it("does not respond when disabled", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MAutoComplete, {
      props: { options, disabled: true, teleport: false, "onUpdate:modelValue": onUpdate },
    });
    const input = screen.getByRole("combobox");
    await expect.element(input).toBeDisabled();
    await input.fill("sh", { force: true });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.container.querySelector('[role="listbox"]')).toBeNull();
  });
});
