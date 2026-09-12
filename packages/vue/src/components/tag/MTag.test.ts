import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MTag } from ".";

describe("MTag", () => {
  it("renders content with type and size classes", async () => {
    const screen = await render(MTag, {
      props: { type: "primary", size: "lg" },
      slots: { default: () => "朱砂" },
    });
    const tag = screen.getByText("朱砂").element().closest(".m-tag")!;
    expect(tag.classList.contains("m-tag--primary")).toBe(true);
    expect(tag.classList.contains("m-tag--lg")).toBe(true);
  });

  it("wires the three-piece frame and the cross as mask variables", async () => {
    const screen = await render(MTag, {
      props: { closable: true },
      slots: { default: () => "底图" },
    });
    const tag = screen.getByText("底图").element().closest<HTMLElement>(".m-tag")!;
    for (const name of ["--m-tag-left", "--m-tag-body", "--m-tag-right", "--m-tag-cross"]) {
      expect(getComputedStyle(tag).getPropertyValue(name)).toMatch(/^url\("data:image\/svg\+xml/);
    }
    // 收口宽度按底图的宽高比算，左右两端略有不同
    expect(Number(tag.style.getPropertyValue("--m-tag-cap-l"))).toBeCloseTo(0.2144, 3);
    expect(Number(tag.style.getPropertyValue("--m-tag-cap-r"))).toBeCloseTo(0.215, 3);
    // 三段遮罩都挂上了，中段只铺内容盒
    const style = getComputedStyle(tag);
    expect(style.maskImage.split("url(").length - 1).toBe(3);
    expect(style.maskClip).toBe("border-box, border-box, content-box");
  });

  it("uses the color prop as the ink color", async () => {
    const screen = await render(MTag, {
      props: { color: "#951c48" },
      slots: { default: () => "菜头紫" },
    });
    const tag = screen.getByText("菜头紫").element().closest<HTMLElement>(".m-tag")!;
    expect(tag.style.getPropertyValue("--m-tag-color")).toBe("#951c48");
    expect(getComputedStyle(tag).backgroundColor).toBe("rgb(149, 28, 72)");
  });

  it("emits close from the close button without bubbling a click", async () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    const screen = await render(MTag, {
      props: { closable: true, onClose, onClick },
      slots: { default: () => "可关" },
    });
    await screen.getByRole("button", { name: "关闭" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not emit close when disabled", async () => {
    const onClose = vi.fn();
    const screen = await render(MTag, {
      props: { closable: true, disabled: true, onClose },
      slots: { default: () => "禁用" },
    });
    const close = screen.getByRole("button", { name: "关闭" });
    await expect.element(close).toBeDisabled();
    await close.click({ force: true });
    expect(onClose).not.toHaveBeenCalled();
    const tag = screen.getByText("禁用").element().closest(".m-tag")!;
    expect(tag.classList.contains("m-tag--disabled")).toBe(true);
  });
});
