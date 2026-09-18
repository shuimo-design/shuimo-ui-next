import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MWatermark } from ".";

function layerOf(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>(".m-watermark__layer")!;
}

describe("MWatermark", () => {
  it("tiles a seeded text mask over the content", async () => {
    const screen = await render(
      <MWatermark content={["水墨", "丹青"]} seed={3}>
        内容
      </MWatermark>,
    );
    await expect.element(screen.getByText("内容")).toBeVisible();
    const root = screen.container.querySelector(".m-watermark")!;
    expect(root.classList.contains("m-watermark--text")).toBe(true);
    expect(root.classList.contains("m-watermark--ink")).toBe(true);
    const layer = layerOf(screen.container);
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    expect(layer.style.getPropertyValue("--m-watermark-image")).toMatch(
      /^url\("data:image\/svg\+xml/,
    );
    expect(layer.style.getPropertyValue("--m-watermark-image-ink")).not.toBe(
      layer.style.getPropertyValue("--m-watermark-image"),
    );
    expect(layer.style.getPropertyValue("--m-watermark-z")).toBe("9");
    expect(getComputedStyle(layer).maskImage).toContain("data:image/svg+xml");
    expect(getComputedStyle(layer).pointerEvents).toBe("none");
  });

  it("tiles the image as a background and skips the ink", async () => {
    const screen = await render(<MWatermark image="/seal.png" content="忽略" ink zIndex={20} />);
    const root = screen.container.querySelector(".m-watermark")!;
    expect(root.classList.contains("m-watermark--image")).toBe(true);
    expect(root.classList.contains("m-watermark--ink")).toBe(false);
    const layer = layerOf(screen.container);
    expect(getComputedStyle(layer).backgroundImage).toContain("data:image/svg+xml");
    expect(getComputedStyle(layer).zIndex).toBe("20");
    expect(layer.style.getPropertyValue("--m-watermark-image")).not.toContain("忽略");
  });

  it("uses one clean image for both skins when ink is off", async () => {
    const screen = await render(<MWatermark content="水墨" ink={false} />);
    const root = screen.container.querySelector(".m-watermark")!;
    expect(root.classList.contains("m-watermark--ink")).toBe(false);
    const layer = layerOf(screen.container);
    expect(layer.style.getPropertyValue("--m-watermark-image-ink")).toBe(
      layer.style.getPropertyValue("--m-watermark-image"),
    );
  });

  it("puts the layer back when it is removed or hidden", async () => {
    const screen = await render(<MWatermark content="水墨" />);
    const root = screen.container.querySelector(".m-watermark")!;
    const layer = layerOf(screen.container);
    layer.remove();
    await expect.poll(() => layer.parentNode).toBe(root);
    layer.style.display = "none";
    await expect.poll(() => layer.style.display).toBe("");
    layer.setAttribute("hidden", "");
    await expect.poll(() => layer.hasAttribute("hidden")).toBe(false);
    expect(layer.style.getPropertyValue("--m-watermark-z")).toBe("9");
  });

  it("re-tiles when the props change", async () => {
    const screen = await render(<MWatermark content="水墨" gap={[0, 0]} />);
    const layer = layerOf(screen.container);
    const before = layer.style.getPropertyValue("--m-watermark-tile");
    await screen.rerender(<MWatermark content="水墨" gap={[50, 50]} />);
    await expect.poll(() => layer.style.getPropertyValue("--m-watermark-tile")).not.toBe(before);
  });
});
