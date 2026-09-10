import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { DARK_MODE_STORAGE_KEY, MDarkMode } from ".";

describe("MDarkMode", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("renders a switch that reflects the current theme", async () => {
    const screen = await render(MDarkMode, { props: { autoMode: false, transition: false } });
    const sw = screen.getByRole("switch");
    await expect.element(sw).toHaveAttribute("aria-checked", "false");
    // 没记录也不跟随系统：不动 html
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(sw.element().querySelector("svg path")).not.toBeNull();
  });

  it("toggles html[data-theme], remembers the choice and emits", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MDarkMode, {
      props: {
        autoMode: false,
        transition: false,
        "onUpdate:modelValue": onUpdate,
        onChange,
      },
    });
    const sw = screen.getByRole("switch");
    await sw.click();
    await expect.element(sw).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(DARK_MODE_STORAGE_KEY)).toBe("dark");
    expect(onUpdate).toHaveBeenLastCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(true);

    await sw.click();
    await expect.element(sw).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(DARK_MODE_STORAGE_KEY)).toBe("light");
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("is disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(MDarkMode, {
      props: { disabled: true, autoMode: false, transition: false, onChange },
    });
    const sw = screen.getByRole("switch");
    await expect.element(sw).toBeDisabled();
    await sw.click({ force: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("restores the stored choice on mount", async () => {
    localStorage.setItem("my-theme", "dark");
    const screen = await render(MDarkMode, {
      props: { storageKey: "my-theme", transition: false },
    });
    await expect.element(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("leaves the theme alone by default and follows the system only with autoMode", async () => {
    delete document.documentElement.dataset.theme;
    await render(MDarkMode, { props: { transition: false } });
    // 默认亮色纸：没记录也不写 data-theme，更不跟随系统
    await new Promise((r) => setTimeout(r, 50));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    await render(MDarkMode, { props: { transition: false, autoMode: true } });
    await expect.poll(() => document.documentElement.dataset.theme).toBe("system");
  });

  it("follows v-model", async () => {
    const screen = await render(MDarkMode, { props: { modelValue: true, transition: false } });
    const sw = screen.getByRole("switch");
    await expect.element(sw).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.dataset.theme).toBe("dark");
    await screen.rerender({ modelValue: false });
    await expect.element(sw).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
