import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MAvatar } from ".";

// 1x1 透明 gif，浏览器能直接解码
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

describe("MAvatar", () => {
  it("renders the image when src loads", async () => {
    const screen = await render(MAvatar, {
      props: { src: PIXEL, alt: "墨客", size: "lg" },
      slots: { default: () => "墨" },
    });
    const img = screen.getByRole("img", { name: "墨客" });
    await expect.element(img).toHaveAttribute("src", PIXEL);
    expect(img.element().classList.contains("m-avatar__img")).toBe(true);
    const root = img.element().closest(".m-avatar")!;
    expect(root.classList.contains("m-avatar--circle")).toBe(true);
    expect(root.classList.contains("m-avatar--lg")).toBe(true);
    expect(screen.container.querySelector(".m-avatar__fallback")).toBeNull();
  });

  it("falls back to the slot when the image fails to load", async () => {
    const onError = vi.fn();
    const screen = await render(MAvatar, {
      props: { src: "data:image/png;base64,broken", alt: "墨客", onError },
      slots: { default: () => "墨" },
    });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    await expect.element(screen.getByText("墨")).toBeVisible();
    expect(screen.container.querySelector(".m-avatar__img")).toBeNull();
    await expect.element(screen.getByRole("img", { name: "墨客" })).toBeVisible();
  });

  it("shows a user icon when there is neither src nor slot", async () => {
    const screen = await render(MAvatar, { props: { alt: "匿名" } });
    await expect.element(screen.getByRole("img", { name: "匿名" })).toBeVisible();
    expect(screen.container.querySelector(".m-avatar__icon")).not.toBeNull();
  });

  it("shows the slot without src and accepts a pixel size", async () => {
    const screen = await render(MAvatar, {
      props: { variant: "square", size: 32 },
      slots: { default: () => "山" },
    });
    const root = screen.getByText("山").element().closest<HTMLElement>(".m-avatar")!;
    expect(root.classList.contains("m-avatar--square")).toBe(true);
    expect(root.style.getPropertyValue("--m-avatar-size")).toBe("32px");
    expect(root.getBoundingClientRect().width).toBe(32);
  });

  it("generates the ink ring or brush square and the ragged mask per variant", async () => {
    const circle = await render(MAvatar, { props: { size: 40, seed: 2 } });
    const c = circle.container.querySelector<HTMLElement>(".m-avatar")!;
    expect(c.style.getPropertyValue("--m-avatar-frame")).toMatch(/^url\("data:image\/svg\+xml/);
    expect(c.style.getPropertyValue("--m-avatar-mask")).toMatch(/^url\("data:image\/svg\+xml/);
    // 圆：图片占八成多，墨圈的飞溅落在盒子外
    expect(c.style.getPropertyValue("--m-avatar-body")).toBe("34px");
    expect(parseFloat(c.style.getPropertyValue("--m-avatar-frame-pad"))).toBeGreaterThan(0);
    const frame = c.querySelector<HTMLElement>(".m-avatar__frame")!;
    expect(frame.getBoundingClientRect().width).toBeGreaterThan(40);

    const square = await render(MAvatar, { props: { size: 40, seed: 2, variant: "square" } });
    const s = square.container.querySelector<HTMLElement>(".m-avatar")!;
    expect(s.style.getPropertyValue("--m-avatar-frame")).not.toBe(
      c.style.getPropertyValue("--m-avatar-frame"),
    );
    // 方：图片退让出笔触边框的宽度
    expect(s.style.getPropertyValue("--m-avatar-body")).toBe("37px");
    expect(s.style.getPropertyValue("--m-avatar-mask-size")).toMatch(/^\d+px \d+px$/);
  });
});
