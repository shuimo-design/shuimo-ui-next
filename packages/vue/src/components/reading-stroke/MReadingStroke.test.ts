import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, type PropType } from "vue";
import { MReadingStroke } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

/** 一个 200px 高、内容 2000px 的滚动盒子（可滚 1800px），笔触盯着它 */
const Host = defineComponent({
  props: {
    strokeProps: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    onChange: { type: Function as PropType<(progress: number) => void>, required: false },
  },
  setup(props) {
    return () =>
      h("div", [
        h(
          "div",
          { id: "box", style: "height: 200px; overflow: auto" },
          h("div", { style: "height: 2000px" }, "很长的内容"),
        ),
        h(MReadingStroke, { target: "#box", ...props.strokeProps, onChange: props.onChange }),
      ]);
  },
});

function box(): HTMLElement {
  return document.querySelector<HTMLElement>("#box")!;
}

function bar(): HTMLElement {
  return document.querySelector<HTMLElement>(".m-reading-stroke")!;
}

/** 滚到某个位置并等 scroll 事件派发（真浏览器在下一帧才发） */
async function scrollBoxTo(top: number) {
  box().scrollTop = top;
  await vi.waitFor(() => expect(box().scrollTop).toBe(top));
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 20)));
}

describe("MReadingStroke", () => {
  it("is a fixed progressbar that writes the scroll progress into aria and the variable", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, { props: { onChange } });
    const el = bar();
    expect(el.getAttribute("role")).toBe("progressbar");
    expect(el.getAttribute("aria-label")).toBe("阅读进度");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("100");
    expect(el.getAttribute("aria-valuenow")).toBe("0");
    expect(el.style.getPropertyValue("--m-reading-stroke-progress")).toBe("0.0000");
    expect(el.classList.contains("m-reading-stroke--top")).toBe(true);
    const computed = getComputedStyle(el);
    expect(computed.position).toBe("fixed");
    expect(computed.top).toBe("0px");
    expect(computed.pointerEvents).toBe("none");
    expect(el.getBoundingClientRect().width).toBe(window.innerWidth);
    expect(el.style.getPropertyValue("--m-reading-stroke-thickness")).toBe("4px");
    expect(el.style.getPropertyValue("--m-reading-stroke-color")).toBe("var(--m-ink)");

    await scrollBoxTo(750);
    await vi.waitFor(() => expect(el.getAttribute("aria-valuenow")).toBe("42"));
    expect(el.style.getPropertyValue("--m-reading-stroke-progress")).toBe("0.4167");
    expect(onChange).toHaveBeenLastCalledWith(750 / 1800);
    expect(screen.getByRole("progressbar", { name: "阅读进度" })).toBeTruthy();

    await scrollBoxTo(1800);
    await vi.waitFor(() => expect(el.getAttribute("aria-valuenow")).toBe("100"));
    expect(el.classList.contains("m-reading-stroke--done")).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("emits change only when a whole percent point is crossed", async () => {
    const onChange = vi.fn();
    await render(Host, { props: { onChange } });
    // 1800px 可滚：9px = 0.5% → 1%，10px 还是 1%，27px = 1.5% → 2%
    await scrollBoxTo(9);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    await scrollBoxTo(10);
    await scrollBoxTo(27);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(onChange.mock.calls.map(([p]) => Math.round((p as number) * 100))).toEqual([1, 2]);
  });

  it("generates the brush mask from the measured width and applies it under m-ink-ready", async () => {
    document.documentElement.classList.add("m-ink-ready");
    await render(Host, { props: { strokeProps: { seed: 3 } } });
    const el = bar();
    await vi.waitFor(() => expect(el.classList.contains("m-reading-stroke--masked")).toBe(true));
    expect(el.style.getPropertyValue("--m-reading-stroke-mask")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    // 笔触按视口宽度分桶生成（64px 一桶）
    const svg = decodeURIComponent(el.style.getPropertyValue("--m-reading-stroke-mask"));
    expect(svg).toContain(`width='${Math.ceil(window.innerWidth / 64) * 64}'`);
    // 条按画幅高度撑起来（比笔宽高），遮罩套在条上
    expect(el.getBoundingClientRect().height).toBeGreaterThan(4);
    const inner = el.querySelector<HTMLElement>(".m-reading-stroke__bar")!;
    expect(getComputedStyle(inner).maskImage).toContain("data:image/svg+xml");
  });

  it("puts position, thickness, color and z-index into the classes and variables", async () => {
    await render(Host, {
      props: { strokeProps: { position: "bottom", thickness: 6, color: "#861717", zIndex: 20 } },
    });
    const el = bar();
    expect(el.classList.contains("m-reading-stroke--bottom")).toBe(true);
    expect(getComputedStyle(el).bottom).toBe("0px");
    expect(getComputedStyle(el).zIndex).toBe("20");
    expect(el.style.getPropertyValue("--m-reading-stroke-thickness")).toBe("6px");
    expect(el.style.getPropertyValue("--m-reading-stroke-color")).toBe("#861717");
    const inner = el.querySelector<HTMLElement>(".m-reading-stroke__bar")!;
    expect(getComputedStyle(inner).backgroundColor).toBe("rgb(134, 23, 23)");
    expect(inner.getBoundingClientRect().height).toBe(6);
  });

  it("accepts an element or a function as the target", async () => {
    const fn = () => document.querySelector<HTMLElement>("#box");
    const screen = await render(Host, {
      props: { strokeProps: { target: fn } as Record<string, unknown> },
    });
    await scrollBoxTo(900);
    await vi.waitFor(() => expect(bar().getAttribute("aria-valuenow")).toBe("50"));
    await screen.rerender({ strokeProps: { target: box() } });
    await scrollBoxTo(450);
    await vi.waitFor(() => expect(bar().getAttribute("aria-valuenow")).toBe("25"));
  });
});
