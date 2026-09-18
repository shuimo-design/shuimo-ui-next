import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, type PropType } from "vue";
import { MShanShui } from ".";

/** 浏览器会把 translate3d 写回 style；取位移的数值 */
function translate(element: HTMLElement): { x: number; y: number } {
  const match = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(element.style.transform);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
}

function layers(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".m-shan-shui__layer"));
}

function kinds(container: HTMLElement): string[] {
  return layers(container).map((el) => el.className.replace("m-shan-shui__layer ", ""));
}

/** 一个 300px 高的滚动盒子：先垫 400px，横幅在垫子下面，滚动盒子就把横幅往上推 */
const Host = defineComponent({
  props: {
    bannerProps: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
  },
  setup(props) {
    return () =>
      h("div", { id: "box", style: "height: 300px; overflow: auto" }, [
        h("div", { style: "height: 400px" }),
        h(MShanShui, { seed: 5, tier: 1, height: 300, ...props.bannerProps }),
        h("div", { style: "height: 1200px" }),
      ]);
  },
});

describe("MShanShui", () => {
  it("paints a seeded scene, fades in once the masks decode and emits ready", async () => {
    const onReady = vi.fn();
    const screen = await render(MShanShui, {
      props: { seed: 11, tier: 1, parallax: "none", height: 320, onReady },
      slots: { default: () => "山水" },
    });
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    expect(onReady.mock.calls[0]![0]).toEqual({ seed: 11, tier: 1 });

    const rootEl = screen.container.querySelector(".m-shan-shui") as HTMLElement;
    expect(rootEl.classList.contains("m-shan-shui--ready")).toBe(true);
    expect(rootEl.classList.contains("m-shan-shui--ink")).toBe(true);
    expect(rootEl.classList.contains("m-shan-shui--tier-1")).toBe(true);
    expect(rootEl.dataset.seed).toBe("11");
    expect(rootEl.style.getPropertyValue("--m-shan-shui-height")).toBe("320px");
    expect(rootEl.getBoundingClientRect().height).toBe(320);
    // 日头、雁阵、三层远山、孤舟，按叠放顺序
    expect(kinds(screen.container)).toEqual([
      "m-shan-shui__sun",
      "m-shan-shui__geese",
      "m-shan-shui__ridge",
      "m-shan-shui__ridge",
      "m-shan-shui__ridge",
      "m-shan-shui__boat",
    ]);
    for (const layer of layers(screen.container)) {
      expect(layer.style.getPropertyValue("--m-shan-shui-mask")).toMatch(
        /^url\("data:image\/svg\+xml/,
      );
    }
    const scene = screen.container.querySelector(".m-shan-shui__scene") as HTMLElement;
    expect(scene.getAttribute("aria-hidden")).toBe("true");
    await expect.element(screen.getByText("山水")).toBeVisible();
  });

  it("tier 0 is flat bands without masks or parallax", async () => {
    const onReady = vi.fn();
    const screen = await render(MShanShui, { props: { seed: 2, tier: 0, height: 200, onReady } });
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    expect(onReady.mock.calls[0]![0]).toEqual({ seed: 2, tier: 0 });
    const rootEl = screen.container.querySelector(".m-shan-shui") as HTMLElement;
    expect(rootEl.classList.contains("m-shan-shui--tier-0")).toBe(true);
    expect(rootEl.className).not.toContain("m-shan-shui--parallax");
    for (const layer of layers(screen.container)) {
      expect(layer.style.getPropertyValue("--m-shan-shui-mask")).toBe("none");
    }
    // 朴素版的山是一块块墩子，远淡近浓
    const ridges = Array.from(
      screen.container.querySelectorAll<HTMLElement>(".m-shan-shui__ridge"),
    );
    expect(ridges).toHaveLength(3);
    const alpha = (el: HTMLElement) => Number(getComputedStyle(el, "::after").opacity);
    expect(alpha(ridges[0]!)).toBeLessThan(alpha(ridges[2]!));
  });

  it("clamps the layer count and drops the optional pieces", async () => {
    const screen = await render(MShanShui, {
      props: { seed: 3, tier: 1, layers: 9, sun: false, geese: false, boat: false, height: 200 },
    });
    expect(kinds(screen.container)).toEqual(Array(5).fill("m-shan-shui__ridge"));
    await screen.rerender({ layers: 1, sun: true });
    expect(kinds(screen.container)).toEqual([
      "m-shan-shui__sun",
      "m-shan-shui__ridge",
      "m-shan-shui__ridge",
    ]);
  });

  it("palette and parallax mode go into the class list, height into the variable", async () => {
    const screen = await render(MShanShui, {
      props: { seed: 3, tier: 1, palette: "dusk", parallax: "pointer", height: "40vh" },
    });
    const rootEl = screen.container.querySelector(".m-shan-shui") as HTMLElement;
    expect(rootEl.classList.contains("m-shan-shui--dusk")).toBe(true);
    expect(rootEl.classList.contains("m-shan-shui--parallax-pointer")).toBe(true);
    expect(rootEl.style.getPropertyValue("--m-shan-shui-height")).toBe("40vh");
  });

  it("pointer parallax moves near layers more than far ones and clears when switched off", async () => {
    const screen = await render(MShanShui, {
      props: { seed: 5, tier: 1, parallax: "pointer", height: 300 },
    });
    const sun = screen.container.querySelector(".m-shan-shui__sun") as HTMLElement;
    const boat = screen.container.querySelector(".m-shan-shui__boat") as HTMLElement;
    // 首帧没有位移：服务端和客户端一致
    expect(translate(boat)).toEqual({ x: 0, y: 0 });
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: window.innerWidth,
        clientY: window.innerHeight / 2,
      }),
    );
    await vi.waitFor(() => expect(translate(boat).x).toBeGreaterThan(5), { timeout: 3000 });
    expect(translate(boat).x).toBeGreaterThan(translate(sun).x * 3);
    await screen.rerender({ parallax: "none" });
    await vi.waitFor(() => expect(boat.style.transform).toBe(""));
  });

  it("scroll parallax follows the banner up whichever container scrolls", async () => {
    const screen = await render(Host);
    const sun = screen.container.querySelector(".m-shan-shui__sun") as HTMLElement;
    const boat = screen.container.querySelector(".m-shan-shui__boat") as HTMLElement;
    const rootEl = screen.container.querySelector(".m-shan-shui") as HTMLElement;
    expect(rootEl.classList.contains("m-shan-shui--parallax-scroll")).toBe(true);
    expect(translate(boat)).toEqual({ x: 0, y: 0 });
    const box = document.querySelector<HTMLElement>("#box")!;
    // 横幅顶边刚到视口顶边：还没越过，不动
    box.scrollTop = 400;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(translate(boat).y).toBe(0);
    // 再滚 200px：近层往下沉得比远层多
    box.scrollTop = 600;
    await vi.waitFor(() => expect(translate(boat).y).toBeGreaterThan(10), { timeout: 3000 });
    expect(translate(boat).y).toBeGreaterThan(translate(sun).y * 3);
    expect(translate(boat).x).toBe(0);
  });
});
