import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, type ComponentPublicInstance } from "vue";
import { MVirtualList, type VirtualListExpose } from ".";

const LIST = Array.from({ length: 1000 }, (_, i) => `第 ${i} 项`);

type ListInstance = ComponentPublicInstance & VirtualListExpose;

/** 包一层拿到组件实例，才能调 scrollTo 这类暴露出来的方法 */
function harness(props: Record<string, unknown>, listRef: { value: ListInstance | null }) {
  return defineComponent({
    setup() {
      return () =>
        h(
          MVirtualList,
          { ...props, ref: (el) => (listRef.value = el as ListInstance | null) },
          {
            default: ({ data, index }: { data: string; index: number }) =>
              h(
                "div",
                { class: "row", style: `height: ${props.itemHeight ?? 20 + (index % 4) * 15}px` },
                data,
              ),
          },
        );
    },
  });
}

async function settle() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

const rendered = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(".m-virtual-list__item")).map((el) =>
    Number(el.dataset.index),
  );

describe("MVirtualList", () => {
  it("renders only the rows around the viewport in fixed-height mode", async () => {
    const listRef = ref<ListInstance | null>(null);
    const screen = await render(
      harness({ list: LIST, itemHeight: 30, height: 150, buffer: 3 }, listRef),
    );
    await settle();
    const indexes = rendered(screen.container);
    // 一屏 5 行 + 下方 3 行缓冲（顶部没有可缓冲的）
    expect(indexes.length).toBeLessThan(20);
    expect(indexes[0]).toBe(0);
    expect(Math.max(...indexes)).toBeGreaterThanOrEqual(5);
    const phantom = screen.container.querySelector<HTMLElement>(".m-virtual-list__phantom")!;
    expect(phantom.style.height).toBe(`${1000 * 30}px`);
  });

  it("scrollTo brings a far row into view and emits scroll", async () => {
    const listRef = ref<ListInstance | null>(null);
    const onScroll = vi.fn();
    const screen = await render(
      harness({ list: LIST, itemHeight: 30, height: 150, onScroll }, listRef),
    );
    await settle();
    listRef.value!.scrollTo(500);
    await settle();
    await settle();
    const viewport = screen.container.querySelector<HTMLElement>(".m-virtual-list")!;
    // auto：目标在下面就贴底，第 500 行的底边对齐可视区底边
    expect(viewport.scrollTop).toBe(500 * 30 + 30 - 150);
    expect(rendered(screen.container)).toContain(500);
    expect(onScroll).toHaveBeenCalled();
    listRef.value!.scrollTo(200, "start");
    await settle();
    expect(viewport.scrollTop).toBe(200 * 30);
  });

  it("measures variable heights and lands on the target row", async () => {
    const listRef = ref<ListInstance | null>(null);
    const screen = await render(
      harness({ list: LIST, estimatedItemHeight: 20, height: 200 }, listRef),
    );
    await settle();
    listRef.value!.scrollTo(600, "start");
    await settle();
    await settle();
    await settle();
    const viewport = screen.container.querySelector<HTMLElement>(".m-virtual-list")!;
    const row = screen.container.querySelector<HTMLElement>('[data-index="600"]');
    expect(row).not.toBeNull();
    // 量过尺寸后再校正：目标行的顶边应该贴着可视区顶边（1px 内）
    const delta = row!.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    expect(Math.abs(delta)).toBeLessThanOrEqual(1);
    // 量过的行按真实高度记入总高：600 行里高度 20/35/50/65 循环，均值 42.5
    const phantom = screen.container.querySelector<HTMLElement>(".m-virtual-list__phantom")!;
    expect(parseFloat(phantom.style.height)).toBeGreaterThan(600 * 20);
  });

  it("emits reachBottom once when scrolled to the end", async () => {
    const listRef = ref<ListInstance | null>(null);
    const onReachBottom = vi.fn();
    const screen = await render(
      harness({ list: LIST.slice(0, 50), itemHeight: 30, height: 150, onReachBottom }, listRef),
    );
    await settle();
    listRef.value!.scrollTo(49, "end");
    await settle();
    await settle();
    expect(onReachBottom).toHaveBeenCalledTimes(1);
    // 停在底部再滚一下不重复报
    listRef.value!.scrollToOffset(10_000);
    await settle();
    expect(onReachBottom).toHaveBeenCalledTimes(1);
    expect(rendered(screen.container)).toContain(49);
  });

  it("renders nothing for an empty list and shows dividers when asked", async () => {
    const listRef = ref<ListInstance | null>(null);
    const screen = await render(harness({ list: [], itemHeight: 30, divider: true }, listRef));
    await settle();
    expect(rendered(screen.container)).toHaveLength(0);
    expect(
      screen.container
        .querySelector(".m-virtual-list")!
        .classList.contains("m-virtual-list--divider"),
    ).toBe(true);
  });
});
