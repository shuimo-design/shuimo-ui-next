import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MScroll } from ".";

/** 400×200 的视口里放一块可改尺寸的内容 */
const Host = defineComponent({
  props: {
    width: { type: Number, default: 800 },
    height: { type: Number, default: 800 },
    always: { type: Boolean, default: false },
  },
  emits: ["scroll"],
  setup(props, { emit }) {
    const size = ref({ w: props.width, h: props.height });
    return () =>
      h("div", [
        h(
          MScroll,
          {
            height: 200,
            always: props.always,
            style: "width: 400px",
            onScroll: (p: unknown) => emit("scroll", p),
          },
          () =>
            h("div", {
              "data-testid": "inside",
              style: `width: ${size.value.w}px; height: ${size.value.h}px`,
            }),
        ),
        h("button", { "data-testid": "shrink", onClick: () => (size.value = { w: 100, h: 100 }) }),
      ]);
  },
});

function query(container: HTMLElement, selector: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el;
}

describe("MScroll", () => {
  it("renders both bars when content overflows and hides them otherwise", async () => {
    const screen = await render(Host);
    await expect.element(screen.getByTestId("inside")).toBeInTheDocument();
    await expect.poll(() => screen.container.querySelectorAll(".m-scroll__thumb").length).toBe(2);
    // 视口 200 高、内容 800 高：滑块约占轨道 1/4
    const thumb = query(screen.container, ".m-scroll__bar--v .m-scroll__thumb");
    const track = query(screen.container, ".m-scroll__bar--v").getBoundingClientRect().height;
    const len = thumb.getBoundingClientRect().height;
    expect(Math.abs(len - track / 4)).toBeLessThan(2);

    await screen.getByTestId("shrink").click();
    await expect.poll(() => screen.container.querySelectorAll(".m-scroll__thumb").length).toBe(0);
  });

  it("moves the thumb and emits scroll when the view scrolls", async () => {
    const onScroll = vi.fn();
    const screen = await render(Host, { props: { onScroll } });
    const view = query(screen.container, ".m-scroll__view");
    await expect.poll(() => screen.container.querySelectorAll(".m-scroll__thumb").length).toBe(2);
    const thumb = query(screen.container, ".m-scroll__bar--v .m-scroll__thumb");
    const before = thumb.getBoundingClientRect().top;

    view.scrollTop = 300;
    await expect.poll(() => onScroll.mock.calls.length).toBeGreaterThan(0);
    expect(onScroll).toHaveBeenLastCalledWith({ scrollTop: 300, scrollLeft: 0 });
    await expect.poll(() => thumb.getBoundingClientRect().top).toBeGreaterThan(before + 20);
    await expect.element(query(screen.container, ".m-scroll")).toHaveClass("m-scroll--scrolling");
  });

  it("scrolls the view when the thumb is dragged", async () => {
    const screen = await render(Host);
    const view = query(screen.container, ".m-scroll__view");
    await expect.poll(() => screen.container.querySelectorAll(".m-scroll__thumb").length).toBe(2);
    const thumb = query(screen.container, ".m-scroll__bar--v .m-scroll__thumb");
    const rect = thumb.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const pointer = (type: string, target: EventTarget, clientY: number) =>
      target.dispatchEvent(
        new PointerEvent(type, { bubbles: true, button: 0, clientX: x, clientY, pointerId: 1 }),
      );

    pointer("pointerdown", thumb, y);
    await expect.element(query(screen.container, ".m-scroll")).toHaveClass("m-scroll--dragging");
    // 轨道约 190px、可动范围约 140px，内容可滚 600px：指针挪 35px 约滚 150px
    pointer("pointermove", window, y + 35);
    await expect.poll(() => view.scrollTop).toBeGreaterThan(100);
    expect(view.scrollTop).toBeLessThan(200);
    pointer("pointerup", window, y + 35);
    await expect
      .poll(() =>
        screen.container.querySelector(".m-scroll")?.classList.contains("m-scroll--dragging"),
      )
      .toBe(false);
    // 松手后再动指针不该继续滚
    const settled = view.scrollTop;
    pointer("pointermove", window, y + 80);
    expect(view.scrollTop).toBe(settled);
  });

  it("keeps bars visible with always", async () => {
    const screen = await render(Host, { props: { always: true } });
    await expect.element(query(screen.container, ".m-scroll")).toHaveClass("m-scroll--always");
    await expect.poll(() => screen.container.querySelectorAll(".m-scroll__thumb").length).toBe(2);
    const bar = query(screen.container, ".m-scroll__bar--v");
    expect(getComputedStyle(bar).opacity).toBe("1");
  });
});
