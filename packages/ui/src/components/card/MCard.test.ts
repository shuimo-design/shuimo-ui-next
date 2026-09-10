import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { MCard } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

describe("MCard", () => {
  it("renders title, body and the default double frame with hover shadow", async () => {
    const screen = await render(MCard, {
      props: { title: "山水" },
      slots: { default: () => "远山近水" },
    });
    await expect.element(screen.getByText("山水")).toBeVisible();
    await expect.element(screen.getByText("远山近水")).toBeVisible();
    const root = screen.container.querySelector<HTMLElement>(".m-card")!;
    expect(root.classList.contains("m-card--double")).toBe(true);
    expect(root.classList.contains("m-card--shadow-hover")).toBe(true);
    expect(root.style.getPropertyValue("--m-card-padding")).toBe("20px");
  });

  it("draws the header divider as a brush line only when there is a header", async () => {
    const withHeader = await render(MCard, {
      props: { title: "题" },
      slots: { default: () => "文" },
    });
    const line = withHeader.container.querySelector<HTMLElement>(".m-card__divider")!;
    expect(line).not.toBeNull();
    await expect
      .poll(() => getComputedStyle(line).getPropertyValue("--m-brush-line-mask"))
      .toContain("data:image/svg+xml");

    const bare = await render(MCard, { slots: { default: () => "无题" } });
    expect(bare.container.querySelector(".m-card__divider")).toBeNull();
    expect(bare.container.querySelector(".m-card__header")).toBeNull();
  });

  it("renders cover, extra, footer and seal slots in order", async () => {
    const screen = await render(MCard, {
      props: { title: "画" },
      slots: {
        cover: () => "封面",
        extra: () => "更多",
        default: () => "正文",
        footer: () => "落款",
        seal: () => "印",
      },
    });
    const texts = [...screen.container.querySelectorAll(".m-card > *")].map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toEqual(["封面", "画更多", "", "正文", "落款", "印"]);
  });

  it("renders no seal node when the slot is empty", async () => {
    const screen = await render(MCard, { slots: { default: () => "素" } });
    expect(screen.container.querySelector(".m-card__seal")).toBeNull();
  });

  it("accepts string padding and drops the frame when borderless", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(MCard, {
      props: { padding: "8px 12px", bordered: false, frame: "brush", shadow: "always" },
      slots: { default: () => "素" },
    });
    const root = screen.container.querySelector<HTMLElement>(".m-card")!;
    expect(root.style.getPropertyValue("--m-card-padding")).toBe("8px 12px");
    expect(root.classList.contains("m-card--borderless")).toBe(true);
    expect(root.classList.contains("m-card--shadow-always")).toBe(true);
    // 不要边框时笔触边框也不生成，但纸（毛边遮罩）还在
    await expect
      .poll(() => getComputedStyle(root).getPropertyValue("--m-card-paper-mask"))
      .toContain("data:image/svg+xml");
    expect(root.hasAttribute("data-ink-stroke")).toBe(false);
  });

  it("keeps the plain CSS frame without the ink engine", async () => {
    const screen = await render(MCard, {
      props: { frame: "brush" },
      slots: { default: () => "笔" },
    });
    const root = screen.container.querySelector<HTMLElement>(".m-card")!;
    // 没开引擎：不生成笔触边框、不生成纸，CSS 的双线框照旧
    await expect
      .poll(() => getComputedStyle(root).getPropertyValue("--m-brush-line-mask"))
      .toBe("");
    expect(root.hasAttribute("data-ink-stroke")).toBe(false);
    expect(getComputedStyle(root).getPropertyValue("--m-card-paper-mask")).toBe("");
    expect(getComputedStyle(root).getPropertyValue("--m-ink-stroke-border")).toBe("");
  });

  it("draws every frame as a brush border on a deckled sheet under m-ink-ready", async () => {
    document.documentElement.classList.add("m-ink-ready");
    for (const frame of ["plain", "double", "brush"] as const) {
      const screen = await render(MCard, {
        props: { frame, title: "册" },
        slots: { default: () => "页" },
      });
      const root = screen.container.querySelector<HTMLElement>(".m-card")!;
      await expect.poll(() => root.hasAttribute("data-ink-stroke")).toBe(true);
      await expect
        .poll(() => getComputedStyle(root).getPropertyValue("--m-ink-stroke-border"))
        .toContain("data:image/svg+xml");
      await expect
        .poll(() => getComputedStyle(root).getPropertyValue("--m-card-paper-mask"))
        .toContain("data:image/svg+xml");
      expect(root.style.getPropertyValue("--m-card-paper-out")).toBe("9px");
    }
    // 纸纹和朱批写在 :root 上，所有卡片共用
    const rootStyle = document.documentElement.style;
    expect(rootStyle.getPropertyValue("--m-ink-sheet-texture")).toContain("data:image/svg+xml");
    expect(rootStyle.getPropertyValue("--m-ink-sheet-mark")).toContain("data:image/svg+xml");
    expect(rootStyle.getPropertyValue("--m-ink-sheet-mark-band")).toBe("16px");
  });

  it("uses a heavier stroke for brush than for plain", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const pad = async (frame: "plain" | "brush") => {
      const screen = await render(MCard, { props: { frame }, slots: { default: () => "笔" } });
      const root = screen.container.querySelector<HTMLElement>(".m-card")!;
      await expect.poll(() => root.style.getPropertyValue("--m-ink-stroke-pad")).toMatch(/px$/);
      return parseFloat(root.style.getPropertyValue("--m-ink-stroke-pad"));
    };
    // 画幅外扩距离随笔宽走，粗笔的外扩一定比细笔大
    expect(await pad("brush")).toBeGreaterThan(await pad("plain"));
  });
});
