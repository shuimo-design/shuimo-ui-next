import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MCollapse, MCollapseItem } from ".";

describe("MCollapse", () => {
  it("expands and collapses items, reporting the next active names", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const screen = await render(
      <MCollapse onValueChange={onValueChange} onChange={onChange}>
        <MCollapseItem name="shan" title="山">
          远山
        </MCollapseItem>
        <MCollapseItem name="shui" title="水">
          流水
        </MCollapseItem>
      </MCollapse>,
    );
    const shan = screen.getByRole("button", { name: "山" });
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
    await shan.click();
    expect(onValueChange).toHaveBeenLastCalledWith(["shan"]);
    expect(onChange).toHaveBeenLastCalledWith(["shan"]);
    await expect.element(shan).toHaveAttribute("aria-expanded", "true");
    await screen.getByRole("button", { name: "水" }).click();
    expect(onValueChange).toHaveBeenLastCalledWith(["shan", "shui"]);
    await shan.click();
    expect(onValueChange).toHaveBeenLastCalledWith(["shui"]);
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps only one item open in accordion mode", async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <MCollapse accordion defaultValue="shan" onValueChange={onValueChange}>
        <MCollapseItem name="shan" title="山">
          远山
        </MCollapseItem>
        <MCollapseItem name="shui" title="水">
          流水
        </MCollapseItem>
      </MCollapse>,
    );
    const shan = screen.getByRole("button", { name: "山" });
    const shui = screen.getByRole("button", { name: "水" });
    await expect.element(shan).toHaveAttribute("aria-expanded", "true");
    await shui.click();
    expect(onValueChange).toHaveBeenLastCalledWith("shui");
    await expect.element(shui).toHaveAttribute("aria-expanded", "true");
    await expect.element(shan).toHaveAttribute("aria-expanded", "false");
    await shui.click();
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
    await expect.element(shui).toHaveAttribute("aria-expanded", "false");
  });

  it("does not respond when the item is disabled", async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <MCollapse onValueChange={onValueChange}>
        <MCollapseItem name="yun" title="云" disabled>
          浮云
        </MCollapseItem>
      </MCollapse>,
    );
    const yun = screen.getByRole("button", { name: "云" });
    await expect.element(yun).toBeDisabled();
    await expect.element(yun).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("works standalone with a boolean value and reports change", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const screen = await render(
      <MCollapseItem title="庭院" onValueChange={onValueChange} onChange={onChange}>
        乱红飞过秋千去
      </MCollapseItem>,
    );
    const header = screen.getByRole("button", { name: "庭院" });
    await expect.element(header).toHaveAttribute("aria-expanded", "false");
    await header.click();
    expect(onValueChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith(true);
    await expect.element(header).toHaveAttribute("aria-expanded", "true");
  });

  it("draws the brush line after the title unless divider is off", async () => {
    const screen = await render(
      <MCollapse>
        <MCollapseItem name="a" title="有线">
          壹
        </MCollapseItem>
        <MCollapseItem name="b" title="无线" divider={false}>
          贰
        </MCollapseItem>
      </MCollapse>,
    );
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
    const screen = await render(
      <MCollapse disabled>
        <MCollapseItem name="a" title="甲">
          壹
        </MCollapseItem>
      </MCollapse>,
    );
    await expect.element(screen.getByRole("button", { name: "甲" })).toBeDisabled();
    expect(screen.container.querySelector(".m-collapse--disabled")).not.toBeNull();
  });

  it("hides collapsed content from the accessibility tree", async () => {
    const screen = await render(
      <MCollapse defaultValue={["shan"]}>
        <MCollapseItem name="shan" title="山">
          远山
        </MCollapseItem>
        <MCollapseItem name="shui" title="水">
          流水
        </MCollapseItem>
      </MCollapse>,
    );
    await expect.element(screen.getByRole("region", { name: "山" })).toBeVisible();
    const content = screen.getByText("流水");
    expect(content.element().closest(".m-collapse-item__content")?.hasAttribute("inert")).toBe(
      true,
    );
  });
});
