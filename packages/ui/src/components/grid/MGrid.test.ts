import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h } from "vue";
// 边框颜色是语义 token，不引 tokens 的话 border 简写整条失效，量出来是 0
import "../../theme/tokens.css";
import { MCell, MGrid } from ".";
import { quadPoints, resolveAngles } from "./quad";

/** 用渲染函数拼一个栅格，免得每个用例都写 template 字符串 */
function grid(
  props: InstanceType<typeof MGrid>["$props"],
  cells: Array<{ props?: InstanceType<typeof MCell>["$props"]; text: string }>,
) {
  return defineComponent({
    setup() {
      return () =>
        h("div", { style: "width: 600px" }, [
          h(MGrid, props, () => cells.map((cell) => h(MCell, cell.props, () => cell.text))),
        ]);
    },
  });
}

async function frame() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

describe("quad geometry", () => {
  it("resolves points shorthand like CSS", () => {
    expect(resolveAngles({ points: 10 })).toEqual({ a: 10, b: 10, c: 10, d: 10 });
    expect(resolveAngles({ points: "10 20" })).toEqual({ a: 10, b: 20, c: 10, d: 20 });
    expect(resolveAngles({ points: "10 20 30" })).toEqual({ a: 10, b: 20, c: 30, d: 20 });
    expect(resolveAngles({ points: "1deg 2 3 4deg", b: -5 })).toEqual({ a: 1, b: -5, c: 3, d: 4 });
    expect(resolveAngles({})).toEqual({ a: 0, b: 0, c: 0, d: 0 });
  });

  it("keeps a straight cell as its box and tilts one side inside the box", () => {
    expect(quadPoints(100, 50, { a: 0, b: 0, c: 0, d: 0 })).toEqual([
      [0, 0],
      [100, 0],
      [100, 50],
      [0, 50],
    ]);
    const [tl, tr, br, bl] = quadPoints(100, 50, { a: 0, b: 45, c: 0, d: 0 });
    expect(tl).toEqual([0, 0]);
    expect(tr).toEqual([100, 0]);
    // 右边 45°：下端往左收 h·tan45 = 50
    expect(br[0]).toBeCloseTo(50);
    expect(br[1]).toBeCloseTo(50);
    expect(bl).toEqual([0, 50]);
  });
});

describe("MGrid / MCell", () => {
  it("splits the width evenly and respects fixed cell widths", async () => {
    const screen = await render(
      grid({ gap: 20 }, [{ text: "甲" }, { text: "乙" }, { props: { w: 100 }, text: "丙" }]),
    );
    await frame();
    const cells = screen.container.querySelectorAll<HTMLElement>(".m-cell");
    expect(cells).toHaveLength(3);
    // 600 - 两道 20 的缝 - 100 固定 = 460，两个自适应格子各 230
    expect(cells[0]!.getBoundingClientRect().width).toBeCloseTo(230, 0);
    expect(cells[1]!.getBoundingClientRect().width).toBeCloseTo(230, 0);
    expect(cells[2]!.getBoundingClientRect().width).toBeCloseTo(100, 0);
    expect(
      cells[1]!.getBoundingClientRect().left - cells[0]!.getBoundingClientRect().right,
    ).toBeCloseTo(20, 0);
  });

  it("passes h down to cells and stacks in column direction", async () => {
    const screen = await render(
      grid({ direction: "column", h: 40, gap: "8px" }, [{ text: "甲" }, { text: "乙" }]),
    );
    await frame();
    const cells = screen.container.querySelectorAll<HTMLElement>(".m-cell");
    expect(cells[0]!.getBoundingClientRect().height).toBeCloseTo(40, 0);
    expect(
      cells[1]!.getBoundingClientRect().top - cells[0]!.getBoundingClientRect().bottom,
    ).toBeCloseTo(8, 0);
  });

  it("tilts the seam between cells with gapRotate and overlaps them by h·tanθ", async () => {
    const screen = await render(
      grid({ h: 100, gap: 10, gapRotate: [45] }, [{ text: "甲" }, { text: "乙" }]),
    );
    await frame();
    await frame();
    const [first, second] = Array.from(screen.container.querySelectorAll<HTMLElement>(".m-cell"));
    expect(first!.classList.contains("m-cell--tilted")).toBe(true);
    expect(second!.classList.contains("m-cell--tilted")).toBe(true);
    // 第二个格子往左压进去 100·tan45 = 100
    expect(second!.style.marginLeft).toBe("-100px");
    const clip = second!.querySelector<HTMLElement>(".m-cell__main")!.style.clipPath;
    expect(clip.startsWith("polygon(")).toBe(true);
    // 左边 45°："/"，左上角右移 100px
    expect(clip).toContain("polygon(100px 0px");
  });

  it("draws a border only when asked", async () => {
    const screen = await render(
      grid({}, [{ props: { border: true }, text: "甲" }, { text: "乙" }]),
    );
    const [withBorder, plain] = Array.from(
      screen.container.querySelectorAll<HTMLElement>(".m-cell"),
    );
    expect(withBorder!.classList.contains("m-cell--border")).toBe(true);
    expect(getComputedStyle(withBorder!).borderTopWidth).toBe("1px");
    expect(getComputedStyle(plain!).borderTopWidth).toBe("0px");
  });

  it("uses a polygon outline for a tilted bordered cell", async () => {
    const screen = await render(
      grid({ h: 60 }, [{ props: { border: true, points: "0 20" }, text: "甲" }]),
    );
    await frame();
    await frame();
    const outline = screen.container.querySelector("svg.m-cell__outline polygon");
    expect(outline).not.toBeNull();
    expect(outline!.getAttribute("points")!.split(" ")).toHaveLength(4);
  });

  it("lays cells on a column grid with span and offset", async () => {
    const screen = await render(
      grid({ cols: 4, gap: 0 }, [
        { props: { span: 2 }, text: "甲" },
        { props: { offset: 1 }, text: "乙" },
      ]),
    );
    await frame();
    const root = screen.container.querySelector<HTMLElement>(".m-grid")!;
    expect(root.classList.contains("m-grid--cols")).toBe(true);
    const [wide, shifted] = Array.from(screen.container.querySelectorAll<HTMLElement>(".m-cell"));
    expect(wide!.getBoundingClientRect().width).toBeCloseTo(300, 0);
    expect(shifted!.getBoundingClientRect().width).toBeCloseTo(150, 0);
    // offset 1：从第 2 列开始；第一行 2 列已被占，落到第二行的第 2 列
    expect(shifted!.getBoundingClientRect().left - root.getBoundingClientRect().left).toBeCloseTo(
      150,
      0,
    );
    expect(shifted!.getBoundingClientRect().top).toBeGreaterThan(wide!.getBoundingClientRect().top);
  });
});
