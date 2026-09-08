import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { ensureInkFilters, type InkFiltersHandle } from "../../ink/bleed";
import { MBorder } from ".";

let filters: InkFiltersHandle;
beforeEach(() => {
  filters = ensureInkFilters();
});
afterEach(() => filters.dispose());

describe("MBorder", () => {
  it("attaches a brush border once ink is ready", async () => {
    const screen = await render(MBorder, {
      props: { seed: 2, style: "width:240px;height:80px" },
      slots: { default: () => "山水" },
    });
    const el = screen.container.querySelector(".m-border") as HTMLElement;
    await vi.waitFor(() => expect(el.hasAttribute("data-ink-stroke")).toBe(true));
    expect(el.style.getPropertyValue("--m-ink-stroke-border")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    expect(el.style.getPropertyValue("--m-ink-stroke-pad")).toMatch(/px$/);
    const before = getComputedStyle(el, "::before");
    expect(before.maskImage === "none" && before.webkitMaskImage === "none").toBe(false);
    await expect.element(screen.getByText("山水")).toBeVisible();
  });
});
