import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MSwitch } from ".";

describe("MSwitch", () => {
  it("toggles between active and inactive values", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MSwitch, {
      props: {
        modelValue: "off",
        activeValue: "on",
        inactiveValue: "off",
        activeText: "开",
        "onUpdate:modelValue": onUpdate,
        onChange,
      },
    });
    const sw = screen.getByRole("switch");
    await expect.element(sw).toHaveAttribute("aria-checked", "false");
    await sw.click();
    expect(onUpdate).toHaveBeenCalledWith("on");
    expect(onChange).toHaveBeenCalledWith("on");
  });

  it("is disabled", async () => {
    const screen = await render(MSwitch, { props: { modelValue: false, disabled: true } });
    await expect.element(screen.getByRole("switch")).toBeDisabled();
  });

  it("only reports the next value when controlled", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MSwitch, {
      props: { modelValue: false, controlled: true, "onUpdate:modelValue": onUpdate, onChange },
    });
    await screen.getByRole("switch").click();
    expect(onChange).toHaveBeenCalledWith(true);
    expect(onUpdate).not.toHaveBeenCalled();
    await expect.element(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("renders texts on both sides and lets slots override them", async () => {
    const screen = await render(MSwitch, {
      props: { modelValue: true, activeText: "active", inactiveText: "inactive" },
      slots: { active: () => "slot active" },
    });
    const sw = screen.getByRole("switch");
    await expect.element(sw).toHaveTextContent("slot active");
    await expect.element(sw).toHaveTextContent("inactive");
    expect(sw.element().textContent).not.toContain("active ");
    expect(screen.container.querySelector(".m-switch--checked")).not.toBeNull();
  });

  it("ignores clicks while loading", async () => {
    const onUpdate = vi.fn();
    const screen = await render(MSwitch, {
      props: { modelValue: false, loading: true, "onUpdate:modelValue": onUpdate },
    });
    await screen.getByRole("switch").click();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
