import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import LandscapeWorker from "../../ink/landscape/worker?worker";
import PaperWorker from "../../ink/paper/worker?worker";
import { inkWorkersKey } from "../../ink/context";
import { MRicePaper } from ".";

const provide = {
  [inkWorkersKey as symbol]: {
    paper: () => new PaperWorker(),
    landscape: () => new LandscapeWorker(),
  },
};

function paintedPixels(canvas: HTMLCanvasElement): number {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) n++;
  return n;
}

describe("MRicePaper", () => {
  it("renders paper and mountain layers, then emits ready", async () => {
    const onReady = vi.fn();
    const screen = await render(MRicePaper, {
      props: { seed: 11, tier: 1, layers: 3, onReady, style: "width:480px;height:240px" },
      slots: { default: () => "内容" },
      global: { provide },
    });
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1), { timeout: 15_000 });
    const payload = onReady.mock.calls[0]![0] as { seed: number; tier: number; polylines: number };
    expect(payload.seed).toBe(11);
    expect(payload.tier).toBe(1);
    expect(payload.polylines).toBeGreaterThan(0);

    const rootEl = screen.container.querySelector(".m-rice-paper") as HTMLElement;
    expect(rootEl.classList.contains("m-rice-paper--ready")).toBe(true);
    const paper = rootEl.querySelector<HTMLCanvasElement>(".m-rice-paper__paper")!;
    expect(paper.width).toBeGreaterThan(0);
    const layers = rootEl.querySelectorAll<HTMLCanvasElement>(".m-rice-paper__layer");
    expect(layers).toHaveLength(3);
    expect([...layers].some((c) => paintedPixels(c) > 50)).toBe(true);
    await expect.element(screen.getByText("内容")).toBeVisible();
  });

  it("tier 0 paints a flat paper without workers", async () => {
    const onReady = vi.fn();
    const screen = await render(MRicePaper, {
      props: { tier: 0, onReady, style: "width:200px;height:100px" },
    });
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    expect(screen.container.querySelectorAll(".m-rice-paper__layer")).toHaveLength(0);
    const paper = screen.container.querySelector<HTMLCanvasElement>(".m-rice-paper__paper")!;
    expect(paintedPixels(paper)).toBe(paper.width * paper.height);
  });
});
