import { describe, expect, it, vi } from "vitest";
import { createParallax } from ".";

/** 浏览器会把 "0.00px" 归一成 "0px"，按数值比较 */
function translateX(element: HTMLElement): number {
  const match = /translate3d\((-?[\d.]+)px/.exec(element.style.transform);
  return match ? Number(match[1]) : Number.NaN;
}

function makeLayer(depth: number) {
  const element = document.createElement("div");
  document.body.append(element);
  return { element, depth };
}

async function settle(frames = 120) {
  for (let i = 0; i < frames; i++) await new Promise(requestAnimationFrame);
}

describe("parallax", () => {
  it("moves near layers more than far layers and converges to target", async () => {
    const far = makeLayer(0);
    const mid = makeLayer(0.5);
    const near = makeLayer(1);
    const parallax = createParallax({
      strength: 20,
      pointer: false,
      scrollFactor: 0,
      reducedMotion: false,
    });
    parallax.setLayers([far, mid, near]);
    parallax.setTarget(1, 0);
    await settle();
    expect(parallax.current.x).toBeGreaterThan(0.99);
    expect(translateX(far.element)).toBe(0);
    expect(translateX(mid.element)).toBeCloseTo(10, 1);
    expect(translateX(near.element)).toBeCloseTo(20, 1);
    parallax.dispose();
    expect(near.element.style.transform).toBe("");
  });

  it("does nothing under reduced motion", async () => {
    const near = makeLayer(1);
    const parallax = createParallax({ reducedMotion: true, pointer: false });
    parallax.setLayers([near]);
    parallax.setTarget(1, 1);
    await settle(10);
    expect(parallax.current).toEqual({ x: 0, y: 0 });
    parallax.dispose();
  });

  it("responds to pointer events on a custom target", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const near = makeLayer(1);
    const parallax = createParallax({
      pointerTarget: host,
      strength: 10,
      scrollFactor: 0,
      reducedMotion: false,
    });
    parallax.setLayers([near]);
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(100);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(100);
    host.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 50, bubbles: true }),
    );
    await settle();
    expect(parallax.current.x).toBeGreaterThan(0.99);
    expect(Math.abs(parallax.current.y)).toBeLessThan(0.01);
    parallax.dispose();
  });
});
