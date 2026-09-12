import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MEmpty } from ".";

describe("MEmpty", () => {
  it("renders the enso figure and the default description", async () => {
    const screen = await render(<MEmpty />);
    await expect.element(screen.getByText("暂无数据")).toBeVisible();
    const root = screen.container.querySelector<HTMLElement>(".m-empty")!;
    expect(root.classList.contains("m-empty--enso")).toBe(true);
    expect(root.style.getPropertyValue("--m-empty-figure")).toMatch(/^url\("data:image\/svg\+xml/);
    expect(root.style.getPropertyValue("--m-empty-image-size")).toBe("120px");
    const figure = root.querySelector<HTMLElement>(".m-empty__figure")!;
    expect(getComputedStyle(figure).maskImage).toContain("data:image/svg+xml");
  });

  it("switches to the ridge figure and honours imageSize", async () => {
    const screen = await render(<MEmpty image="ridge" imageSize={80} />);
    const root = screen.container.querySelector<HTMLElement>(".m-empty")!;
    expect(root.classList.contains("m-empty--ridge")).toBe(true);
    expect(root.style.getPropertyValue("--m-empty-image-size")).toBe("80px");
    const image = root.querySelector<HTMLElement>(".m-empty__image")!;
    expect(image.getBoundingClientRect().height).toBe(80);
  });

  it("reuses the same generated figure across instances", async () => {
    const a = await render(<MEmpty />);
    const b = await render(<MEmpty />);
    const url = (screen: typeof a) =>
      screen.container
        .querySelector<HTMLElement>(".m-empty")!
        .style.getPropertyValue("--m-empty-figure");
    expect(url(a)).toBe(url(b));
  });

  it("hides the figure with image none and renders the slot props", async () => {
    const screen = await render(
      <MEmpty image="none" descriptionNode="还没有收藏">
        <button type="button">去逛逛</button>
      </MEmpty>,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-empty")!;
    expect(root.querySelector(".m-empty__image")).toBeNull();
    expect(root.style.getPropertyValue("--m-empty-figure")).toBe("");
    await expect.element(screen.getByText("还没有收藏")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "去逛逛" })).toBeVisible();
  });

  it("uses the figure prop instead of the built-in figure", async () => {
    const screen = await render(<MEmpty figure={<svg data-testid="pic" viewBox="0 0 10 10" />} />);
    const root = screen.container.querySelector<HTMLElement>(".m-empty")!;
    expect(root.classList.contains("m-empty--custom")).toBe(true);
    expect(root.querySelector(".m-empty__figure")).toBeNull();
    expect(root.querySelector('[data-testid="pic"]')).not.toBeNull();
  });
});
