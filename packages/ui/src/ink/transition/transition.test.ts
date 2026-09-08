import { describe, expect, it } from "vitest";
import { prepareInkViewTransition, startInkViewTransition, supportsViewTransition } from ".";

describe("ink view transition", () => {
  it("writes mask variables to :root", () => {
    prepareInkViewTransition({ seed: 3, direction: "down", duration: 500 });
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--m-ink-vt-mask")).toContain("data:image/svg+xml");
    expect(style.getPropertyValue("--m-ink-vt-duration")).toBe("500ms");
    expect(style.getPropertyValue("--m-ink-vt-size")).toBe("100% 200%");
  });

  it("runs the update inside a view transition when supported", async () => {
    let ran = false;
    let sawClass = false;
    await startInkViewTransition(
      () => {
        ran = true;
        sawClass = document.documentElement.classList.contains("m-ink-vt");
      },
      { duration: 80, reducedMotion: false },
    );
    expect(ran).toBe(true);
    if (supportsViewTransition()) expect(sawClass).toBe(true);
    expect(document.documentElement.classList.contains("m-ink-vt")).toBe(false);
  });

  it("falls back to a plain update under reduced motion", async () => {
    let ran = false;
    await startInkViewTransition(() => void (ran = true), { reducedMotion: true });
    expect(ran).toBe(true);
    expect(document.documentElement.classList.contains("m-ink-vt")).toBe(false);
  });
});
