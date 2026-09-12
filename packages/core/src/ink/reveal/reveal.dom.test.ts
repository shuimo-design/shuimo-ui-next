import { describe, expect, it } from "vitest";
import { revealElement, wipeMaskUrl } from ".";

function box(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "width:120px;height:40px;background:#000";
  document.body.append(el);
  return el;
}

describe("ink reveal", () => {
  it("wipe mask is cached per seed and decodes to a 2:1 image", async () => {
    expect(wipeMaskUrl({ seed: 1 })).toBe(wipeMaskUrl({ seed: 1 }));
    expect(wipeMaskUrl({ seed: 1 })).not.toBe(wipeMaskUrl({ seed: 2 }));
    const img = new Image();
    img.src = wipeMaskUrl({ seed: 1 });
    await img.decode();
    expect(img.naturalWidth).toBe(img.naturalHeight * 2);
  });

  it("wipe mask stretches to the element box instead of letterboxing", () => {
    // mask-size 会把它拉成元素的 200%×100%；没有 none 就只盖住中间一条，两侧内容整段消失
    for (const direction of ["right", "left", "down", "up"] as const) {
      const svg = decodeURIComponent(wipeMaskUrl({ direction }).split(",")[1]!);
      expect(svg).toContain('preserveAspectRatio="none"');
    }
  });

  it("animates mask-position and cleans up afterwards", async () => {
    const el = box();
    const done = revealElement(el, { duration: 120, reducedMotion: false });
    expect(el.getAttribute("data-ink-reveal")).toBe("self");
    expect(getComputedStyle(el).maskImage).toContain("data:image/svg+xml");
    expect(el.getAnimations()).toHaveLength(1);
    await done;
    expect(el.hasAttribute("data-ink-reveal")).toBe(false);
    expect(getComputedStyle(el).maskImage).toBe("none");
  });

  it("reverse hides the element at the end", async () => {
    const el = box();
    await revealElement(el, { duration: 60, reverse: true, reducedMotion: false });
    expect(el.style.visibility).toBe("hidden");
  });

  it("skips animation under reduced motion", async () => {
    const el = box();
    await revealElement(el, { reducedMotion: true });
    expect(el.getAnimations()).toHaveLength(0);
    expect(el.hasAttribute("data-ink-reveal")).toBe(false);
  });
});
