import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MRadio, MRadioGroup } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

describe("MRadio", () => {
  it("reports its value on click", async () => {
    const onCheckedChange = vi.fn();
    const onChange = vi.fn();
    const screen = await render(
      <MRadio value="shan" label="山" onCheckedChange={onCheckedChange} onChange={onChange} />,
    );
    const radio = screen.getByRole("radio", { name: "山" });
    await expect.element(radio).not.toBeChecked();
    await radio.click();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith("shan", expect.anything());
    await expect.element(radio).toBeChecked();
  });

  it("is checked when controlled from outside", async () => {
    const screen = await render(<MRadio value={1} checked label="一" />);
    await expect.element(screen.getByRole("radio", { name: "一" })).toBeChecked();
  });

  it("renders a numeric label", async () => {
    const screen = await render(<MRadio value={1} label={1} />);
    await expect.element(screen.getByRole("radio", { name: "1" })).toBeVisible();
  });

  it("draws the ring and dot with ink masks under m-ink-ready", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(<MRadio value="x" checked label="墨" />);
    const root = screen.container.querySelector<HTMLElement>(".m-radio")!;
    expect(root.style.getPropertyValue("--m-radio-ring-mask")).toContain("data:image/svg+xml");
    expect(root.style.getPropertyValue("--m-radio-dot-mask")).toContain("data:image/svg+xml");
    const dot = screen.container.querySelector<HTMLElement>(".m-radio__dot")!;
    expect(getComputedStyle(dot, "::before").maskImage).toContain("data:image/svg+xml");
    expect(getComputedStyle(dot, "::after").maskImage).toContain("data:image/svg+xml");
  });

  it("does not respond when disabled", async () => {
    const onCheckedChange = vi.fn();
    const screen = await render(
      <MRadio value="x" label="禁" disabled onCheckedChange={onCheckedChange} />,
    );
    await expect.element(screen.getByRole("radio", { name: "禁" })).toBeDisabled();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe("MRadioGroup", () => {
  it("keeps exactly one item checked", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const screen = await render(
      <MRadioGroup defaultValue="shan" onValueChange={onValueChange} onChange={onChange}>
        <MRadio value="shan" label="山" />
        <MRadio value="shui" label="水" />
        <MRadio value="yun" label="云" />
      </MRadioGroup>,
    );
    await expect.element(screen.getByRole("radiogroup")).toBeVisible();
    await expect.element(screen.getByRole("radio", { name: "山" })).toBeChecked();
    await screen.getByRole("radio", { name: "水" }).click();
    expect(onValueChange).toHaveBeenLastCalledWith("shui");
    expect(onChange).toHaveBeenLastCalledWith("shui");
    await expect.element(screen.getByRole("radio", { name: "水" })).toBeChecked();
    await expect.element(screen.getByRole("radio", { name: "山" })).not.toBeChecked();
    await expect.element(screen.getByRole("radio", { name: "云" })).not.toBeChecked();
  });

  it("moves selection with arrow keys", async () => {
    const screen = await render(
      <MRadioGroup defaultValue="shan">
        <MRadio value="shan" label="山" />
        <MRadio value="shui" label="水" />
        <MRadio value="yun" label="云" />
      </MRadioGroup>,
    );
    await screen.getByRole("radio", { name: "山" }).click();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByRole("radio", { name: "水" })).toBeChecked();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByRole("radio", { name: "云" })).toBeChecked();
  });

  it("disables every item when the group is disabled", async () => {
    const screen = await render(
      <MRadioGroup defaultValue="shan" disabled direction="vertical">
        <MRadio value="shan" label="山" />
        <MRadio value="shui" label="水" />
      </MRadioGroup>,
    );
    expect(screen.container.querySelector(".m-radio-group--vertical")).not.toBeNull();
    await expect.element(screen.getByRole("radio", { name: "水" })).toBeDisabled();
    await expect.element(screen.getByRole("radio", { name: "山" })).toBeChecked();
  });
});
