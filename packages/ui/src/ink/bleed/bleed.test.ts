import { afterEach, describe, expect, it } from "vitest";
import { INK_FILTERS_ID, INK_READY_CLASS, ensureInkFilters } from ".";

afterEach(() => document.getElementById(INK_FILTERS_ID)?.remove());

describe("ink filters", () => {
  it("injects the filter defs once and marks html ready", () => {
    const a = ensureInkFilters({ seed: 3 });
    const b = ensureInkFilters();
    expect(a.element).toBe(b.element);
    expect(document.querySelectorAll(`#${INK_FILTERS_ID}`)).toHaveLength(1);
    expect(document.getElementById("m-ink-bleed")?.tagName.toLowerCase()).toBe("filter");
    expect(document.getElementById("m-ink-bleed-heavy")).not.toBeNull();
    expect(document.documentElement.classList.contains(INK_READY_CLASS)).toBe(true);
    a.dispose();
    expect(document.getElementById(INK_FILTERS_ID)).toBeNull();
    expect(document.documentElement.classList.contains(INK_READY_CLASS)).toBe(false);
  });
});
