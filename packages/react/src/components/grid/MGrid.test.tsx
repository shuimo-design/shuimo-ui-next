import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { quadPoints, resolveAngles } from "@shuimo-design/core";
import { MCell, MGrid, type MGridProps, type ReactGridCell } from ".";

/** 用子组件写法拼一个栅格 */
function Grid(props: MGridProps & { children?: ReactNode }) {
  return (
    <div style={{ width: 600 }}>
      <MGrid {...props} />
    </div>
  );
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
      <Grid gap={20}>
        <MCell>甲</MCell>
        <MCell>乙</MCell>
        <MCell w={100}>丙</MCell>
      </Grid>,
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

  it("takes cells as data and lays them out the same way", async () => {
    const cells: ReactGridCell[] = [
      { content: "甲" },
      { content: "乙" },
      { w: 100, content: "丙" },
    ];
    const screen = await render(<Grid gap={20} cells={cells} />);
    await frame();
    const rendered = screen.container.querySelectorAll<HTMLElement>(".m-cell");
    expect(rendered).toHaveLength(3);
    expect([...rendered].map((cell) => cell.textContent?.trim())).toEqual(["甲", "乙", "丙"]);
    expect(rendered[0]!.getBoundingClientRect().width).toBeCloseTo(230, 0);
    expect(rendered[2]!.getBoundingClientRect().width).toBeCloseTo(100, 0);
  });

  it("passes h down to cells and stacks in column direction", async () => {
    const screen = await render(
      <Grid direction="column" h={40} gap="8px">
        <MCell>甲</MCell>
        <MCell>乙</MCell>
      </Grid>,
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
      <Grid h={100} gap={10} gapRotate={[45]}>
        <MCell>甲</MCell>
        <MCell>乙</MCell>
      </Grid>,
    );
    await frame();
    await frame();
    const [first, second] = [...screen.container.querySelectorAll<HTMLElement>(".m-cell")];
    expect(first!.classList.contains("m-cell--tilted")).toBe(true);
    expect(second!.classList.contains("m-cell--tilted")).toBe(true);
    // 第二个格子往左压进去 100·tan45 = 100
    expect(second!.style.marginLeft).toBe("-100px");
    const clip = second!.querySelector<HTMLElement>(".m-cell__main")!.style.clipPath;
    expect(clip.startsWith("polygon(")).toBe(true);
    // 左边 45°："/"，左上角右移 100px
    expect(clip).toContain("polygon(100px 0px");
  });

  it("splits gapRotate by array position when cells come as data", async () => {
    const screen = await render(
      <Grid h={100} gap={10} gapRotate={[45]} cells={[{ content: "甲" }, { content: "乙" }]} />,
    );
    await frame();
    await frame();
    const [first, second] = [...screen.container.querySelectorAll<HTMLElement>(".m-cell")];
    expect(first!.classList.contains("m-cell--tilted")).toBe(true);
    expect(second!.style.marginLeft).toBe("-100px");
  });

  it("draws a border only when asked", async () => {
    const screen = await render(
      <Grid>
        <MCell border>甲</MCell>
        <MCell>乙</MCell>
      </Grid>,
    );
    const [withBorder, plain] = [...screen.container.querySelectorAll<HTMLElement>(".m-cell")];
    expect(withBorder!.classList.contains("m-cell--border")).toBe(true);
    expect(getComputedStyle(withBorder!).borderTopWidth).toBe("1px");
    expect(getComputedStyle(plain!).borderTopWidth).toBe("0px");
  });

  it("uses a polygon outline for a tilted bordered cell", async () => {
    const screen = await render(
      <Grid h={60}>
        <MCell border points="0 20">
          甲
        </MCell>
      </Grid>,
    );
    await frame();
    await frame();
    const outline = screen.container.querySelector("svg.m-cell__outline polygon");
    expect(outline).not.toBeNull();
    expect(outline!.getAttribute("points")!.split(" ")).toHaveLength(4);
  });

  it("lays cells on a column grid with span and offset", async () => {
    const screen = await render(
      <Grid cols={4} gap={0}>
        <MCell span={2}>甲</MCell>
        <MCell offset={1}>乙</MCell>
      </Grid>,
    );
    await frame();
    const root = screen.container.querySelector<HTMLElement>(".m-grid")!;
    expect(root.classList.contains("m-grid--cols")).toBe(true);
    const [wide, shifted] = [...screen.container.querySelectorAll<HTMLElement>(".m-cell")];
    expect(wide!.getBoundingClientRect().width).toBeCloseTo(300, 0);
    expect(shifted!.getBoundingClientRect().width).toBeCloseTo(150, 0);
    // offset 1：从第 2 列开始；第一行 2 列已被占，落到第二行的第 2 列
    expect(shifted!.getBoundingClientRect().left - root.getBoundingClientRect().left).toBeCloseTo(
      150,
      0,
    );
    expect(shifted!.getBoundingClientRect().top).toBeGreaterThan(wide!.getBoundingClientRect().top);
  });

  it("renders a standalone MCell outside any grid", async () => {
    const screen = await render(
      <MCell w={140} h={90} border points="0 12">
        独
      </MCell>,
    );
    await frame();
    await frame();
    const cell = screen.container.querySelector<HTMLElement>(".m-cell")!;
    expect(cell.classList.contains("m-cell--tilted")).toBe(true);
    expect(cell.style.getPropertyValue("--m-cell-w")).toBe("140px");
    expect(cell.querySelector("svg.m-cell__outline polygon")).not.toBeNull();
  });
});
