import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { MRicePaper } from ".";

/** 浏览器会把 translate3d 写回 style；取横向位移的数值 */
function translateX(element: HTMLElement): number {
  const match = /translate3d\((-?[\d.]+)px/.exec(element.style.transform);
  return match ? Number(match[1]) : 0;
}

describe("MRicePaper", () => {
  it("paints a seeded texture and emits ready", async () => {
    const onReady = vi.fn();
    const screen = await render(MRicePaper, {
      props: { seed: 11, tier: 1, onReady, style: "width:320px;height:160px" },
      slots: { default: () => "内容" },
    });
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    const payload = onReady.mock.calls[0]![0] as { seed: number; tier: number };
    expect(payload.seed).toBe(11);
    expect(payload.tier).toBe(1);

    const rootEl = screen.container.querySelector(".m-rice-paper") as HTMLElement;
    expect(rootEl.classList.contains("m-rice-paper--ready")).toBe(true);
    expect(rootEl.dataset.seed).toBe("11");
    const texture = getComputedStyle(rootEl, "::before").backgroundImage;
    expect(texture).toContain("data:image/svg+xml");
    await expect.element(screen.getByText("内容")).toBeVisible();
  });

  it("tier 0 is a flat paper without texture or landscape", async () => {
    const onReady = vi.fn();
    const screen = await render(MRicePaper, {
      props: { tier: 0, paper: "teaStained", onReady, style: "width:200px;height:100px" },
    });
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    const rootEl = screen.container.querySelector(".m-rice-paper") as HTMLElement;
    expect(getComputedStyle(rootEl, "::before").backgroundImage).not.toContain("url(");
    expect(getComputedStyle(rootEl).backgroundColor).toBe("rgb(240, 228, 200)");
    expect(screen.container.querySelector(".m-rice-paper__landscape")).toBeNull();
  });

  it("layers gold flecks above the texture when asked", async () => {
    const screen = await render(MRicePaper, {
      props: {
        seed: 3,
        tier: 1,
        goldFlecks: { color: "silver", density: 0.8 },
        style: "width:200px;height:100px",
      },
    });
    const rootEl = screen.container.querySelector(".m-rice-paper") as HTMLElement;
    expect(rootEl.style.getPropertyValue("--m-rice-paper-gold")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    const images = getComputedStyle(rootEl, "::before").backgroundImage;
    expect(images.match(/url\("data:/g)).toHaveLength(2);
    expect(getComputedStyle(rootEl, "::before").backgroundSize).toBe("768px 768px, 384px 384px");
    await screen.rerender({ goldFlecks: false });
    expect(rootEl.style.getPropertyValue("--m-rice-paper-gold")).toBe("none");
  });

  it("applies a deckle mask when asked", async () => {
    const screen = await render(MRicePaper, {
      props: { seed: 2, tier: 1, deckleEdge: true, style: "width:200px;height:100px" },
    });
    const rootEl = screen.container.querySelector(".m-rice-paper") as HTMLElement;
    expect(rootEl.classList.contains("m-rice-paper--deckle")).toBe(true);
    // 遮罩要等量到尺寸才生成，按 32px 分桶：200 × 100 → 224 × 128
    await vi.waitFor(() =>
      expect(getComputedStyle(rootEl).maskImage).toContain("data:image/svg+xml"),
    );
    const svg = decodeURIComponent(rootEl.style.getPropertyValue("--m-rice-paper-mask"));
    expect(svg).toContain("width='224' height='128'");
  });

  it("draws four ridge layers at the bottom and moves near layers more than far ones", async () => {
    const screen = await render(MRicePaper, {
      props: { seed: 5, tier: 1, style: "width:800px;height:400px" },
    });
    const ridges = Array.from(
      screen.container.querySelectorAll<HTMLElement>(".m-rice-paper__ridge"),
    );
    expect(ridges).toHaveLength(4);
    expect(screen.container.querySelectorAll(".m-rice-paper__ridge--left")).toHaveLength(2);
    expect(screen.container.querySelectorAll(".m-rice-paper__ridge--right")).toHaveLength(2);
    for (const ridge of ridges) {
      expect(ridge.style.getPropertyValue("--m-rice-paper-ridge")).toMatch(
        /^url\("data:image\/svg\+xml/,
      );
      // 墨层和纸色垫层各自套遮罩：垫层用实心剪影挡住后面的山
      expect(getComputedStyle(ridge, "::after").maskImage).toContain("data:image/svg+xml");
      expect(getComputedStyle(ridge, "::before").maskImage).toContain("data:image/svg+xml");
      expect(ridge.style.getPropertyValue("--m-rice-paper-ridge-silhouette")).not.toBe(
        ridge.style.getPropertyValue("--m-rice-paper-ridge"),
      );
      // 山贴在纸的底边
      const paper = (
        screen.container.querySelector(".m-rice-paper") as HTMLElement
      ).getBoundingClientRect();
      expect(Math.abs(ridge.getBoundingClientRect().bottom - paper.bottom)).toBeLessThan(2);
    }
    // 同 seed 同山：左右两侧远层拿到的不是同一张图
    const [leftFar, , rightFar] = ridges;
    expect(leftFar!.style.getPropertyValue("--m-rice-paper-ridge")).not.toBe(
      rightFar!.style.getPropertyValue("--m-rice-paper-ridge"),
    );

    // 鼠标移到最右边：近层位移比远层大
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: window.innerWidth,
        clientY: window.innerHeight / 2,
      }),
    );
    await vi.waitFor(() => expect(translateX(ridges[1]!)).toBeGreaterThan(5), { timeout: 3000 });
    expect(translateX(ridges[1]!)).toBeGreaterThan(translateX(ridges[0]!) * 2);
    // 放开视差后 transform 清掉
    await screen.rerender({ parallax: false });
    await vi.waitFor(() => expect(ridges[1]!.style.transform).toBe(""));
  });

  it("landscape can be switched off", async () => {
    const screen = await render(MRicePaper, {
      props: { seed: 5, tier: 1, landscape: false, style: "width:400px;height:200px" },
    });
    expect(screen.container.querySelector(".m-rice-paper__landscape")).toBeNull();
    const rootEl = screen.container.querySelector(".m-rice-paper") as HTMLElement;
    expect(rootEl.classList.contains("m-rice-paper--landscape")).toBe(false);
    await screen.rerender({ landscape: true });
    await vi.waitFor(() =>
      expect(screen.container.querySelectorAll(".m-rice-paper__ridge")).toHaveLength(4),
    );
  });

  it("full-screen layout fills the viewport", async () => {
    const screen = await render(MRicePaper, { props: { tier: 0, layout: "full-screen" } });
    const rootEl = screen.container.querySelector(".m-rice-paper") as HTMLElement;
    expect(rootEl.classList.contains("m-rice-paper--full-screen")).toBe(true);
    expect(rootEl.getBoundingClientRect().height).toBe(window.innerHeight);
  });
});
