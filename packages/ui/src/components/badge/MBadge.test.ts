import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, nextTick, ref } from "vue";
import { MBadge } from ".";

describe("MBadge", () => {
  it("renders the value at the corner of its content", async () => {
    const screen = await render(MBadge, {
      props: { value: 5 },
      slots: { default: () => "信" },
    });
    const root = screen.getByText("信").element().closest<HTMLElement>(".m-badge")!;
    expect(root.classList.contains("m-badge--danger")).toBe(true);
    expect(root.classList.contains("m-badge--standalone")).toBe(false);
    const sup = root.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(sup.textContent).toBe("5");
    expect(getComputedStyle(sup).position).toBe("absolute");
  });

  it("caps the number at max and writes the offset as variables", async () => {
    const screen = await render(MBadge, {
      props: { value: 120, max: 99, offset: [4, -2], type: "success" },
      slots: { default: () => "件" },
    });
    const root = screen.getByText("件").element().closest<HTMLElement>(".m-badge")!;
    expect(root.querySelector(".m-badge__sup")!.textContent).toBe("99+");
    expect(root.style.getPropertyValue("--m-badge-offset-x")).toBe("4px");
    expect(root.style.getPropertyValue("--m-badge-offset-y")).toBe("-2px");
    expect(root.classList.contains("m-badge--success")).toBe(true);
  });

  it("hides zero unless showZero, and hides everything when hidden", async () => {
    const zero = await render(MBadge, { props: { value: 0 }, slots: { default: () => "零" } });
    expect(zero.container.querySelector(".m-badge__sup")).toBeNull();

    const shown = await render(MBadge, {
      props: { value: 0, showZero: true },
      slots: { default: () => "显零" },
    });
    expect(shown.container.querySelector(".m-badge__sup")!.textContent).toBe("0");

    const hidden = await render(MBadge, {
      props: { value: 3, hidden: true },
      slots: { default: () => "藏" },
    });
    expect(hidden.container.querySelector(".m-badge__sup")).toBeNull();
  });

  it("renders a dot without text and a standalone pill without content", async () => {
    const dot = await render(MBadge, {
      props: { dot: true, value: 9 },
      slots: { default: () => "点" },
    });
    const sup = dot.container.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(sup.textContent).toBe("");
    expect(sup.getAttribute("aria-hidden")).toBe("true");
    expect(Math.round(sup.getBoundingClientRect().width)).toBe(8);

    const alone = await render(MBadge, { props: { value: "新" } });
    const root = alone.container.querySelector<HTMLElement>(".m-badge")!;
    expect(root.classList.contains("m-badge--standalone")).toBe(true);
    const pill = root.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(pill.textContent).toBe("新");
    expect(getComputedStyle(pill).position).toBe("static");
  });

  it("writes the seal masks for the ink layer as variables on the root", async () => {
    const seal = await render(MBadge, { props: { value: 5 }, slots: { default: () => "印" } });
    const root = seal.container.querySelector<HTMLElement>(".m-badge")!;
    expect(getComputedStyle(root).getPropertyValue("--m-badge-shape")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    expect(root.style.getPropertyValue("--m-badge-shape-pad")).toMatch(/^\d+px$/);
    expect(getComputedStyle(root).getPropertyValue("--m-badge-paste")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    expect(getComputedStyle(root).getPropertyValue("--m-badge-dot")).toBe("");

    // 不同宽度档位不是同一枚印拉宽：1 位数和 "99+" 的外形不同
    const wide = await render(MBadge, { props: { value: 120 }, slots: { default: () => "宽" } });
    const wideRoot = wide.container.querySelector<HTMLElement>(".m-badge")!;
    expect(getComputedStyle(wideRoot).getPropertyValue("--m-badge-shape")).not.toBe(
      getComputedStyle(root).getPropertyValue("--m-badge-shape"),
    );

    const dot = await render(MBadge, { props: { dot: true }, slots: { default: () => "滴" } });
    const dotRoot = dot.container.querySelector<HTMLElement>(".m-badge")!;
    expect(getComputedStyle(dotRoot).getPropertyValue("--m-badge-dot")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    expect(getComputedStyle(dotRoot).getPropertyValue("--m-badge-shape")).toBe("");
  });

  it("bumps only after the value changes", async () => {
    const value = ref(1);
    const Demo = defineComponent({
      setup: () => () => h(MBadge, { value: value.value }, { default: () => "数" }),
    });
    const screen = await render(Demo);
    const find = () => screen.container.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(find().classList.contains("m-badge__sup--bump")).toBe(false);
    value.value = 2;
    await nextTick();
    expect(find().textContent).toBe("2");
    expect(find().classList.contains("m-badge__sup--bump")).toBe(true);
  });
});
