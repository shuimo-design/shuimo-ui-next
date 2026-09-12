import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MSvg } from ".";

describe("MSvg", () => {
  it("renders a named line icon as decoration by default", async () => {
    const screen = await render(MSvg, { props: { name: "check" } });
    const root = screen.container.querySelector(".m-svg");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.querySelector("svg.m-icon")).not.toBeNull();
    expect(root?.querySelector(".m-svg__ink")).toBeNull();
  });

  it("renders the brush-stroke version as a mask when ink is on", async () => {
    const screen = await render(MSvg, { props: { name: "check", ink: true } });
    const root = screen.container.querySelector<HTMLElement>(".m-svg");
    expect(root?.classList.contains("m-svg--ink")).toBe(true);
    expect(root?.querySelector(".m-svg__ink")).not.toBeNull();
    expect(root?.style.getPropertyValue("--m-svg-mask")).toContain("data:image/svg+xml");
  });

  it("falls back to the line icon when there is no ink mark for the name", async () => {
    const screen = await render(MSvg, { props: { name: "search", ink: true } });
    const root = screen.container.querySelector(".m-svg");
    expect(root?.querySelector("svg.m-icon")).not.toBeNull();
    expect(root?.querySelector(".m-svg__ink")).toBeNull();
  });

  it("exposes title as an accessible image and applies size / color / rotate / spin", async () => {
    const screen = await render(MSvg, {
      props: {
        name: "loading",
        title: "加载中",
        size: 32,
        color: "rgb(1, 2, 3)",
        rotate: 90,
        spin: true,
      },
    });
    const root = screen.getByRole("img", { name: "加载中" });
    await expect.element(root).toBeVisible();
    const el = root.element() as HTMLElement;
    expect(el.style.fontSize).toBe("32px");
    expect(el.style.color).toBe("rgb(1, 2, 3)");
    expect(el.style.getPropertyValue("--m-svg-rotate")).toBe("90deg");
    expect(el.classList.contains("m-svg--spin")).toBe(true);
  });

  it("renders slot content when no name is given", async () => {
    const screen = await render(MSvg, {
      slots: {
        default: () =>
          h("svg", { viewBox: "0 0 10 10", "data-testid": "custom" }, [
            h("rect", { width: 10, height: 10 }),
          ]),
      },
    });
    await expect.element(screen.getByTestId("custom")).toBeInTheDocument();
  });
});
