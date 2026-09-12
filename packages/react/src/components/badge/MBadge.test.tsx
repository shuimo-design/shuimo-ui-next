import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MBadge } from ".";

describe("MBadge", () => {
  it("renders the value at the corner of its content", async () => {
    const screen = await render(<MBadge value={5}>信</MBadge>);
    const root = screen.getByText("信").element().closest<HTMLElement>(".m-badge")!;
    expect(root.classList.contains("m-badge--danger")).toBe(true);
    expect(root.classList.contains("m-badge--standalone")).toBe(false);
    const sup = root.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(sup.textContent).toBe("5");
    expect(getComputedStyle(sup).position).toBe("absolute");
  });

  it("caps the number at max and writes the offset as variables", async () => {
    const screen = await render(
      <MBadge value={120} max={99} offset={[4, -2]} type="success">
        件
      </MBadge>,
    );
    const root = screen.getByText("件").element().closest<HTMLElement>(".m-badge")!;
    expect(root.querySelector(".m-badge__sup")!.textContent).toBe("99+");
    expect(root.style.getPropertyValue("--m-badge-offset-x")).toBe("4px");
    expect(root.style.getPropertyValue("--m-badge-offset-y")).toBe("-2px");
    expect(root.classList.contains("m-badge--success")).toBe(true);
  });

  it("hides zero unless showZero, and hides everything when hidden", async () => {
    const zero = await render(<MBadge value={0}>零</MBadge>);
    expect(zero.container.querySelector(".m-badge__sup")).toBeNull();

    const shown = await render(
      <MBadge value={0} showZero>
        显零
      </MBadge>,
    );
    expect(shown.container.querySelector(".m-badge__sup")!.textContent).toBe("0");

    const hidden = await render(
      <MBadge value={3} hidden>
        藏
      </MBadge>,
    );
    expect(hidden.container.querySelector(".m-badge__sup")).toBeNull();
  });

  it("renders a dot without text and a standalone pill without content", async () => {
    const dot = await render(
      <MBadge dot value={9}>
        点
      </MBadge>,
    );
    const sup = dot.container.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(sup.textContent).toBe("");
    expect(sup.getAttribute("aria-hidden")).toBe("true");
    expect(Math.round(sup.getBoundingClientRect().width)).toBe(8);

    const alone = await render(<MBadge value="新" />);
    const root = alone.container.querySelector<HTMLElement>(".m-badge")!;
    expect(root.classList.contains("m-badge--standalone")).toBe(true);
    const pill = root.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(pill.textContent).toBe("新");
    expect(getComputedStyle(pill).position).toBe("static");
  });

  it("writes the seal masks for the ink layer as variables on the root", async () => {
    const seal = await render(<MBadge value={5}>印</MBadge>);
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
    const wide = await render(<MBadge value={120}>宽</MBadge>);
    const wideRoot = wide.container.querySelector<HTMLElement>(".m-badge")!;
    expect(getComputedStyle(wideRoot).getPropertyValue("--m-badge-shape")).not.toBe(
      getComputedStyle(root).getPropertyValue("--m-badge-shape"),
    );

    const dot = await render(<MBadge dot>滴</MBadge>);
    const dotRoot = dot.container.querySelector<HTMLElement>(".m-badge")!;
    expect(getComputedStyle(dotRoot).getPropertyValue("--m-badge-dot")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    expect(getComputedStyle(dotRoot).getPropertyValue("--m-badge-shape")).toBe("");
  });

  it("bumps only after the value changes", async () => {
    function Demo() {
      const [value, setValue] = useState(1);
      return (
        <button type="button" onClick={() => setValue(2)}>
          <MBadge value={value}>数</MBadge>
        </button>
      );
    }
    const screen = await render(<Demo />);
    const find = () => screen.container.querySelector<HTMLElement>(".m-badge__sup")!;
    expect(find().classList.contains("m-badge__sup--bump")).toBe(false);
    await screen.getByRole("button").click();
    await expect.poll(() => find().textContent).toBe("2");
    expect(find().classList.contains("m-badge__sup--bump")).toBe(true);
  });
});
