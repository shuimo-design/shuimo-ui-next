import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, type PropType } from "vue";
import { MAnchor, type AnchorItem } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

const ITEMS: AnchorItem[] = [
  { href: "#shan", title: "山" },
  { href: "#shui", title: "水", children: [{ href: "#quan", title: "泉" }] },
  { href: "#yun", title: "云" },
];

/** 一个 200px 高的滚动盒子，四节各 400px；导航盯着它，父组件真的把 current 写回去 */
const Host = defineComponent({
  props: {
    extra: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    slot: { type: Boolean, default: false },
  },
  setup(props) {
    const current = ref("");
    return () =>
      h("div", [
        h(
          "div",
          { id: "box", style: "height: 200px; overflow: auto" },
          ["shan", "shui", "quan", "yun"].map((id) =>
            h("section", { id, style: "height: 400px" }, id),
          ),
        ),
        h(
          MAnchor,
          {
            items: ITEMS,
            container: "#box",
            ...props.extra,
            current: current.value,
            "onUpdate:current": (v: string) => (current.value = v),
          },
          props.slot
            ? {
                item: ({ item, active }: { item: AnchorItem; active: boolean }) =>
                  h("em", `${active ? "▶ " : ""}${item.title}`),
              }
            : undefined,
        ),
        h("output", { "data-testid": "out" }, current.value),
      ]);
  },
});

function box(): HTMLElement {
  return document.querySelector<HTMLElement>("#box")!;
}

describe("MAnchor", () => {
  it("renders a nav of links, flattens children with indent and marks the active one", async () => {
    const screen = await render(Host);
    const nav = screen.getByRole("navigation", { name: "锚点导航" });
    await expect.element(nav).toBeVisible();
    const links = screen.container.querySelectorAll<HTMLAnchorElement>(".m-anchor__link");
    expect([...links].map((a) => a.getAttribute("href"))).toEqual([
      "#shan",
      "#shui",
      "#quan",
      "#yun",
    ]);
    expect(
      links[2]!.closest<HTMLElement>(".m-anchor__item")!.style.getPropertyValue("--m-anchor-level"),
    ).toBe("1");
    // 挂载时第一节就在顶上：山激活
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
    await expect
      .element(screen.getByRole("link", { name: "山" }))
      .toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "水" }).element().hasAttribute("aria-current")).toBe(
      false,
    );
  });

  it("follows the scroll through v-model:current and emits change", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, { props: { extra: { onChange } } });
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
    box().scrollTop = 450;
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    expect(onChange).toHaveBeenLastCalledWith("#shui");
    box().scrollTop = 850;
    await expect.element(screen.getByTestId("out")).toHaveTextContent("quan");
    // 指示线跟着激活项挪
    const ink = screen.container.querySelector<HTMLElement>(".m-anchor__ink")!;
    await expect.poll(() => ink.style.transform).not.toBe("translateY(0px)");
    expect(Number.parseFloat(ink.style.height)).toBeGreaterThan(0);
  });

  it("scrolls the container on click, keeps the hash unless updateHash, and emits click", async () => {
    const onClick = vi.fn();
    const screen = await render(Host, { props: { extra: { onClick, smooth: false } } });
    await screen.getByRole("link", { name: "云" }).click();
    expect(onClick).toHaveBeenCalledWith("#yun", expect.any(MouseEvent));
    await expect.element(screen.getByTestId("out")).toHaveTextContent("yun");
    await vi.waitFor(() => expect(box().scrollTop).toBe(1200));
    expect(location.hash).toBe("");
  });

  it("offsets the target by targetOffset and writes the hash when asked", async () => {
    const screen = await render(Host, {
      props: { extra: { smooth: false, targetOffset: 24, updateHash: true } },
    });
    await screen.getByRole("link", { name: "水" }).click();
    await vi.waitFor(() => expect(box().scrollTop).toBe(400 - 24));
    expect(location.hash).toBe("#shui");
    history.replaceState(null, "", location.pathname);
  });

  it("is reachable from the keyboard: Tab to a link, Enter scrolls", async () => {
    const screen = await render(Host, { props: { extra: { smooth: false } } });
    (screen.getByRole("link", { name: "泉" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("quan");
    await vi.waitFor(() => expect(box().scrollTop).toBe(800));
  });

  it("renders the item slot with the active flag", async () => {
    const screen = await render(Host, { props: { slot: true } });
    await expect.element(screen.getByRole("link", { name: "▶ 山" })).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "水" })).toBeVisible();
    expect(screen.container.querySelectorAll("em")).toHaveLength(4);
  });

  it("switches to the horizontal layout, affix and a brush indicator", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(Host, {
      props: { extra: { direction: "horizontal", affix: true, offset: 32 } },
    });
    const nav = screen.container.querySelector<HTMLElement>(".m-anchor")!;
    expect(nav.classList.contains("m-anchor--horizontal")).toBe(true);
    expect(nav.classList.contains("m-anchor--affix")).toBe(true);
    expect(nav.style.getPropertyValue("--m-anchor-top")).toBe("32px");
    const ink = nav.querySelector<HTMLElement>(".m-anchor__ink")!;
    await expect.poll(() => Number.parseFloat(ink.style.width)).toBeGreaterThan(0);
    expect(ink.style.transform).toBe("translateX(0px)");
    await expect
      .poll(() => getComputedStyle(ink).getPropertyValue("--m-brush-line-mask"))
      .toContain("url(");
  });
});
