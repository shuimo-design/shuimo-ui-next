import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { ensureInkFilters, type InkFiltersHandle } from "../../ink/bleed";
import { MBorder } from ".";

let filters: InkFiltersHandle;
beforeEach(() => {
  filters = ensureInkFilters();
});
afterEach(() => filters.dispose());

async function mountBorder(props: Record<string, unknown>) {
  const screen = await render(MBorder, {
    props: { seed: 2, style: "width:240px;height:80px", ...props },
    slots: { default: () => "山水" },
  });
  const el = screen.container.querySelector(".m-border") as HTMLElement;
  await vi.waitFor(() => expect(el.hasAttribute("data-ink-stroke")).toBe(true));
  await vi.waitFor(() =>
    expect(getComputedStyle(el).getPropertyValue("--m-ink-stroke-border")).toMatch(
      /^url\("data:image\/svg\+xml/,
    ),
  );
  return { screen, el };
}

describe("MBorder", () => {
  it("attaches a brush border once ink is ready", async () => {
    const { screen, el } = await mountBorder({});
    expect(el.style.getPropertyValue("--m-ink-stroke-pad")).toMatch(/px$/);
    const before = getComputedStyle(el, "::before");
    expect(before.maskImage === "none" && before.webkitMaskImage === "none").toBe(false);
    await expect.element(screen.getByText("山水")).toBeVisible();
    // 内容贴边：默认没有内边距，笔触压在内容边缘上
    expect(getComputedStyle(el).paddingTop).toBe("0px");
  });

  it("single-side switches win over the border prop", async () => {
    const full = await mountBorder({});
    const partial = await mountBorder({ border: false, left: true });
    expect(partial.el.classList.contains("m-border--no-top")).toBe(true);
    expect(partial.el.classList.contains("m-border--no-right")).toBe(true);
    expect(partial.el.classList.contains("m-border--no-bottom")).toBe(true);
    expect(partial.el.classList.contains("m-border--no-left")).toBe(false);
    // 少画三条边，生成的 SVG 明显更短
    const fullSvg = getComputedStyle(full.el).getPropertyValue("--m-ink-stroke-border");
    const partialSvg = getComputedStyle(partial.el).getPropertyValue("--m-ink-stroke-border");
    expect(partialSvg.length).toBeLessThan(fullSvg.length * 0.6);

    const mixed = await mountBorder({ border: { top: false, right: false }, right: true });
    expect(mixed.el.classList.contains("m-border--no-top")).toBe(true);
    expect(mixed.el.classList.contains("m-border--no-right")).toBe(false);
    expect(mixed.el.classList.contains("m-border--no-bottom")).toBe(false);
  });

  it("mask, color and padding are exposed as css variables", async () => {
    const { el } = await mountBorder({ mask: true, color: "rgb(134, 23, 23)", padding: 12 });
    expect(el.classList.contains("m-border--mask")).toBe(true);
    expect(getComputedStyle(el).backdropFilter).toContain("blur");
    expect(getComputedStyle(el).paddingTop).toBe("12px");
    expect(el.style.getPropertyValue("--m-border-color")).toBe("rgb(134, 23, 23)");
    expect(getComputedStyle(el, "::before").backgroundColor).toBe("rgb(134, 23, 23)");
  });

  it("redraws when the seed changes", async () => {
    const { screen, el } = await mountBorder({});
    const first = getComputedStyle(el).getPropertyValue("--m-ink-stroke-border");
    await screen.rerender({ seed: 9 });
    await vi.waitFor(() =>
      expect(getComputedStyle(el).getPropertyValue("--m-ink-stroke-border")).not.toBe(first),
    );
  });
});
