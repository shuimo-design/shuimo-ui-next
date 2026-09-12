import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MCheckbox, MCheckboxGroup } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

describe("MCheckbox", () => {
  it("toggles its own state on click", async () => {
    const onCheckedChange = vi.fn();
    const onChange = vi.fn();
    const screen = await render(
      <MCheckbox label="留白" onCheckedChange={onCheckedChange} onChange={onChange} />,
    );
    const box = screen.getByRole("checkbox", { name: "留白" });
    await expect.element(box).not.toBeChecked();
    await box.click();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    await expect.element(box).toBeChecked();
  });

  it("stays put when controlled and the value does not come back", async () => {
    const onCheckedChange = vi.fn();
    const screen = await render(
      <MCheckbox checked={false} label="受控" onCheckedChange={onCheckedChange} />,
    );
    const box = screen.getByRole("checkbox", { name: "受控" });
    await box.click();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await expect.element(box).not.toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const onCheckedChange = vi.fn();
    const screen = await render(
      <MCheckbox label="禁" disabled onCheckedChange={onCheckedChange} />,
    );
    await expect.element(screen.getByRole("checkbox", { name: "禁" })).toBeDisabled();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("renders a numeric label", async () => {
    const screen = await render(<MCheckbox label={2024} />);
    await expect.element(screen.getByRole("checkbox", { name: "2024" })).toBeVisible();
  });

  it("swaps the box for a brush border and the mark for an ink mask under m-ink-ready", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(<MCheckbox checked label="墨" />);
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
    const screen = await render(<MCheckbox label="半" indeterminate />);
    await expect
      .element(screen.getByRole("checkbox", { name: "半" }))
      .toHaveAttribute("aria-checked", "mixed");
  });
});

describe("MCheckboxGroup", () => {
  it("collects values from children", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const screen = await render(
      <MCheckboxGroup defaultValue={["shan"]} onValueChange={onValueChange} onChange={onChange}>
        <MCheckbox value="shan" label="山" />
        <MCheckbox value="shui" label="水" />
        <MCheckbox value="yun" label="云" />
      </MCheckboxGroup>,
    );
    await expect.element(screen.getByRole("group")).toBeVisible();
    await expect.element(screen.getByRole("checkbox", { name: "山" })).toBeChecked();
    await screen.getByRole("checkbox", { name: "水" }).click();
    expect(onValueChange).toHaveBeenLastCalledWith(["shan", "shui"]);
    expect(onChange).toHaveBeenLastCalledWith(["shan", "shui"]);
    await expect.element(screen.getByRole("checkbox", { name: "水" })).toBeChecked();
    await screen.getByRole("checkbox", { name: "山" }).click();
    expect(onValueChange).toHaveBeenLastCalledWith(["shui"]);
    await expect.element(screen.getByRole("checkbox", { name: "山" })).not.toBeChecked();
  });

  it("locks unchecked items when max is reached", async () => {
    const screen = await render(
      <MCheckboxGroup defaultValue={["shan"]} max={2}>
        <MCheckbox value="shan" label="山" />
        <MCheckbox value="shui" label="水" />
        <MCheckbox value="yun" label="云" />
      </MCheckboxGroup>,
    );
    await screen.getByRole("checkbox", { name: "水" }).click();
    await expect.element(screen.getByRole("checkbox", { name: "云" })).toBeDisabled();
    await expect.element(screen.getByRole("checkbox", { name: "山" })).not.toBeDisabled();
  });

  it("locks the last checked item when min is reached, and lays out vertically", async () => {
    const screen = await render(
      <MCheckboxGroup defaultValue={["shan"]} min={1} direction="vertical">
        <MCheckbox value="shan" label="山" />
        <MCheckbox value="shui" label="水" />
      </MCheckboxGroup>,
    );
    expect(screen.container.querySelector(".m-checkbox-group--vertical")).not.toBeNull();
    await expect.element(screen.getByRole("checkbox", { name: "山" })).toBeDisabled();
    await expect.element(screen.getByRole("checkbox", { name: "水" })).not.toBeDisabled();
  });

  it("disables every item when the group is disabled", async () => {
    const screen = await render(
      <MCheckboxGroup defaultValue={["shan"]} disabled>
        <MCheckbox value="shan" label="山" />
        <MCheckbox value="shui" label="水" />
      </MCheckboxGroup>,
    );
    await expect.element(screen.getByRole("checkbox", { name: "山" })).toBeDisabled();
    await expect.element(screen.getByRole("checkbox", { name: "水" })).toBeDisabled();
  });
});
