import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { createGlyphMeasurer, generateStamp } from "../../ink/stamp";
import { MStamp } from ".";

function svgOf(root: HTMLElement): SVGSVGElement {
  return root.querySelector("svg")!;
}

describe("MStamp", () => {
  it("renders one <text> per character with the seal as an image", async () => {
    const screen = await render(MStamp, { props: { text: ["水墨", "丹青"], seed: 3 } });
    const stamp = screen.getByRole("img", { name: "水墨 丹青" }).element() as HTMLElement;
    const texts = [...svgOf(stamp).querySelectorAll("text")];
    expect(texts.map((t) => t.textContent)).toEqual(["水", "墨", "丹", "青"]);
    // 第一列在最右：水的横坐标大于丹
    const tx = (t: SVGTextElement) =>
      Number(/translate\(([\d.]+)/.exec(t.getAttribute("transform")!)![1]);
    expect(tx(texts[0]!)).toBeGreaterThan(tx(texts[2]!));
    expect(stamp.classList.contains("m-stamp--yang")).toBe(true);
    expect(svgOf(stamp).querySelector(".m-stamp__border")).not.toBeNull();
    expect(svgOf(stamp).querySelector("clipPath path")).not.toBeNull();
  });

  it("wires the runtime filters into defs and onto the layers", async () => {
    const screen = await render(MStamp, { props: { text: "听雨", seed: 3 } });
    const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
    const filters = [...svg.querySelectorAll("filter")].map((f) => f.id);
    expect(filters).toHaveLength(2);
    const inkGroup = svg.querySelector(".m-stamp__border")!.parentElement!;
    expect(inkGroup.getAttribute("filter")).toBe(
      `url(#${filters.find((f) => f.endsWith("-ink"))})`,
    );
    const textGroup = svg.querySelector("text")!.parentElement!;
    expect(textGroup.getAttribute("filter")).toBe(
      `url(#${filters.find((f) => f.endsWith("-text"))})`,
    );
    // 滤镜里的元素要在 SVG 命名空间里才会生效
    expect(svg.querySelector("feTurbulence")?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.querySelector("feTurbulence")?.getAttribute("baseFrequency")).toMatch(/^[\d.]+$/);
  });

  it("gives every instance its own filter ids", async () => {
    const screen = await render({
      components: { MStamp },
      template: '<div><MStamp text="一" /><MStamp text="二" /></div>',
    });
    const ids = [...screen.container.querySelectorAll("filter")].map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(4);
  });

  it("yin mode masks the body with the text and grid lines", async () => {
    const screen = await render(MStamp, {
      props: { text: ["落梅听", "风雪"], mode: "yin", gridLines: true, seed: 9 },
    });
    const stamp = screen.getByRole("img").element() as HTMLElement;
    const svg = svgOf(stamp);
    const mask = svg.querySelector("mask")!;
    expect(mask.querySelectorAll("text")).toHaveLength(5);
    // 两列之间一道竖界格，三行之间两道横界格
    expect(mask.querySelectorAll(".m-stamp__grid")).toHaveLength(3);
    const body = svg.querySelector(".m-stamp__body")!;
    expect(body.parentElement!.getAttribute("mask")).toBe(`url(#${mask.id})`);
    expect(svg.querySelector(".m-stamp__border")).toBeNull();
    expect(stamp.classList.contains("m-stamp--yin")).toBe(true);
  });

  it("keeps the same border path for the same seed and changes it with another", async () => {
    const path = async (seed: number) => {
      const screen = await render(MStamp, { props: { text: "印", seed, shape: "square" } });
      const d = screen.container.querySelector(".m-stamp__border")!.getAttribute("d");
      screen.unmount();
      return d;
    };
    expect(await path(11)).toBe(await path(11));
    expect(await path(11)).not.toBe(await path(12));
  });

  it("applies color, font and rotate as component variables", async () => {
    const screen = await render(MStamp, {
      props: { text: "闲章", color: "#1a2847", font: "'Songti SC', serif", rotate: -6 },
    });
    const stamp = screen.getByRole("img").element() as HTMLElement;
    expect(stamp.style.getPropertyValue("--m-stamp-color")).toBe("#1a2847");
    expect(stamp.style.getPropertyValue("--m-stamp-font")).toBe("'Songti SC', serif");
    expect(stamp.style.getPropertyValue("--m-stamp-rotate")).toBe("-6deg");
    expect(getComputedStyle(svgOf(stamp).querySelector("text")!).fill).toBe("rgb(26, 40, 71)");
    expect(getComputedStyle(svgOf(stamp)).fontFamily).toContain("Songti SC");
  });

  it("measures with the font the svg actually renders in", async () => {
    // 两种字体的墨迹框不一样，量对了字体，排出来的章宽就不一样
    const widthWith = async (font: string) => {
      const screen = await render(MStamp, {
        props: { text: "水墨", shape: "auto", carving: 0, bleed: 0, font },
      });
      const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
      const fallback = generateStamp({
        text: "水墨",
        shape: "auto",
        carving: 0,
        bleed: 0,
        id: "x",
      });
      await expect.poll(() => Number(svg.getAttribute("width"))).not.toBeCloseTo(fallback.width, 3);
      const w = Number(svg.getAttribute("width"));
      screen.unmount();
      return w;
    };
    const serif = await widthWith("serif");
    const mono = await widthWith("monospace");
    expect(serif).not.toBeCloseTo(mono, 1);
    // 和用同一个度量函数直接生成的结果一致
    const expected = generateStamp({
      text: "水墨",
      shape: "auto",
      carving: 0,
      bleed: 0,
      id: "x",
      measure: createGlyphMeasurer("serif"),
    });
    expect(serif).toBeCloseTo(expected.width, 3);
  });

  it("re-lays out with measured glyph boxes once the font is ready", async () => {
    const screen = await render(MStamp, {
      props: { text: "水墨", shape: "auto", carving: 0, bleed: 0 },
    });
    const svg = svgOf(screen.getByRole("img").element() as HTMLElement);
    // 用系统字体量出来的墨迹框和兜底比例不会完全一样，所以宽度会和兜底排版不同
    const fallback = generateStamp({ text: "水墨", shape: "auto", carving: 0, bleed: 0, id: "x" });
    await expect.poll(() => Number(svg.getAttribute("width"))).not.toBeCloseTo(fallback.width, 3);
    const text = svg.querySelector("text")!;
    expect(text.getAttribute("font-size")).toBe("100");
    expect(text.getAttribute("transform")).toMatch(/^translate\([\d.]+ [\d.]+\) scale\(/);
  });
});
