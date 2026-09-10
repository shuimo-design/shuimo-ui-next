import { describe, expect, it } from "vitest";
import { createRng } from "../random";
import { erodeRings } from "./erosion";
import { generateStamp, splitColumns } from "./index";
import { FALLBACK_METRIC, layoutStamp } from "./layout";
import { buildBorder, ringBBox } from "./shape";

const measure = () => FALLBACK_METRIC;

describe("splitColumns", () => {
  it("splits a flat string into a near-square grid, columns first", () => {
    // 5 个字 → 3 列（2 / 2 / 1），第一列在最右
    expect(splitColumns("落梅听风雪")).toEqual([["落", "梅"], ["听", "风"], ["雪"]]);
    expect(splitColumns("水墨")).toEqual([["水"], ["墨"]]);
    expect(splitColumns("水墨丹青")).toEqual([
      ["水", "墨"],
      ["丹", "青"],
    ]);
    expect(splitColumns("落梅听风雪", 1)).toEqual([["落", "梅", "听", "风", "雪"]]);
  });

  it("keeps explicit columns as given", () => {
    expect(splitColumns(["落梅听", "风雪"])).toEqual([
      ["落", "梅", "听"],
      ["风", "雪"],
    ]);
  });
});

describe("buildBorder", () => {
  it("makes a square with inner ring inset by thickness", () => {
    const b = buildBorder("square", { width: 100, height: 100, thickness: 4 });
    expect(ringBBox(b.outer)).toEqual({ x1: 0, y1: 0, x2: 100, y2: 100 });
    expect(ringBBox(b.inner)).toEqual({ x1: 4, y1: 4, x2: 96, y2: 96 });
  });

  it("randomizes corner radii per seed but stays deterministic", () => {
    const a = buildBorder("square", {
      width: 100,
      height: 100,
      thickness: 4,
      cornerRadius: 10,
      rng: createRng(3),
    });
    const b = buildBorder("square", {
      width: 100,
      height: 100,
      thickness: 4,
      cornerRadius: 10,
      rng: createRng(3),
    });
    const c = buildBorder("square", {
      width: 100,
      height: 100,
      thickness: 4,
      cornerRadius: 10,
      rng: createRng(4),
    });
    expect(a.outer).toEqual(b.outer);
    expect(a.outer).not.toEqual(c.outer);
  });

  it("builds an n-gon with the requested number of vertices", () => {
    const hex = buildBorder("polygon", { width: 100, height: 100, thickness: 4, sides: 6 });
    expect(hex.outer).toHaveLength(6);
    // flat-top：最上面两个顶点同高
    const ys = hex.outer.map(([, y]) => Math.round(y * 100) / 100);
    expect(ys[0]).toBe(ys[5]);
    const tri = buildBorder("polygon", {
      width: 100,
      height: 100,
      thickness: 4,
      sides: 3,
      orientation: "point-top",
    });
    expect(tri.outer[0]![1]).toBeCloseTo(0, 5);
  });
});

describe("erodeRings", () => {
  it("returns input untouched at roughness 0 and perturbs otherwise", () => {
    const b = buildBorder("square", { width: 200, height: 200, thickness: 6 });
    const plain = [b.outer];
    expect(erodeRings(plain, { roughness: 0, thickness: 6, size: 200 }, createRng(1))).toBe(plain);
    const rough = erodeRings([b.outer], { roughness: 1, thickness: 6, size: 200 }, createRng(1));
    // 加密后顶点变多，且不再全落在原来的直线上
    expect(rough[0]!.length).toBeGreaterThan(4);
    const onEdge = ([x, y]: [number, number]) =>
      Math.abs(x) < 0.01 ||
      Math.abs(x - 200) < 0.01 ||
      Math.abs(y) < 0.01 ||
      Math.abs(y - 200) < 0.01;
    expect(rough[0]!.some((p) => !onEdge(p))).toBe(true);
    // 起伏最多 thickness 的一半往外，缺口只往里咬
    for (const [x, y] of rough[0]!) {
      expect(x).toBeGreaterThan(-3.5);
      expect(y).toBeGreaterThan(-3.5);
      expect(x).toBeLessThan(203.5);
      expect(y).toBeLessThan(203.5);
    }
    // 至少有一处缺口咬进去超过厚度的三成
    const bite = rough[0]!.map(([x, y]) => Math.min(x, y, 200 - x, 200 - y));
    expect(Math.max(...bite)).toBeGreaterThan(6 * 0.3);
  });
});

describe("layoutStamp", () => {
  const base = {
    measure,
    size: 120,
    thickness: 3,
    padding: 5,
    rowGap: 2,
    columnGap: 2,
  } as const;

  it("places columns right to left and rows top to bottom", () => {
    const l = layoutStamp({
      ...base,
      shape: "square",
      columns: [
        ["水", "墨"],
        ["丹", "青"],
      ],
    });
    expect(l.width).toBe(120);
    expect(l.height).toBe(120);
    const cell = (ch: string) => l.cells.find((c) => c.char === ch)!;
    expect(cell("水").x).toBeGreaterThan(cell("丹").x);
    expect(cell("水").y).toBeLessThan(cell("墨").y);
    expect(cell("水").y).toBe(cell("丹").y);
    // 格子平分文字区域，两列等宽
    expect(cell("水").w).toBeCloseTo(cell("丹").w, 6);
    expect(l.cells.every((c) => c.transform.startsWith("translate("))).toBe(true);
  });

  it("keeps forced shapes at the requested size even when the text is wide", () => {
    const l = layoutStamp({ ...base, shape: "square", columns: [["水"], ["墨"]] });
    expect([l.width, l.height]).toEqual([120, 120]);
    const poly = layoutStamp({ ...base, shape: "polygon", aspect: 1.5, columns: [["水"], ["墨"]] });
    expect([poly.width, poly.height]).toEqual([180, 120]);
    // 字缩到能并排放下：每列宽不超过一半
    expect(l.cells.every((c) => c.w <= 60)).toBe(true);
  });

  it("hugs the text for auto shape: two stacked characters give a tall seal", () => {
    const l = layoutStamp({ ...base, shape: "auto", columns: [["水", "墨"]] });
    expect(l.height).toBe(120);
    expect(l.width).toBeLessThan(120);
    const side = layoutStamp({ ...base, shape: "auto", columns: [["水"], ["墨"]] });
    expect(side.width).toBeGreaterThan(side.height);
  });

  it("uses one shared font size when not stretching", () => {
    const l = layoutStamp({
      ...base,
      shape: "auto",
      columns: [["水", "墨"], ["画"]],
      stretch: false,
    });
    const scales = l.cells.map((c) => /scale\(([\d.]+) ([\d.]+)\)/.exec(c.transform)!.slice(1, 3));
    expect(new Set(scales.map((s) => s.join(","))).size).toBe(1);
  });

  it("lays circular text on a ring with rotation", () => {
    const l = layoutStamp({
      ...base,
      shape: "circle",
      direction: "circular",
      columns: [["一", "期", "一", "会"]],
    });
    expect(l.cells).toHaveLength(4);
    expect(l.cells[0]!.transform).not.toContain("rotate(");
    expect(l.cells[1]!.transform).toContain("rotate(90)");
    expect(l.cells[0]!.y).toBeLessThan(l.cells[2]!.y);
  });
});

describe("generateStamp", () => {
  it("is deterministic per seed and emits filters plus paths", () => {
    const a = generateStamp({ text: "水墨", id: "s1", seed: 5 });
    const b = generateStamp({ text: "水墨", id: "s1", seed: 5 });
    const c = generateStamp({ text: "水墨", id: "s1", seed: 6 });
    expect(a.borderPath).toBe(b.borderPath);
    expect(a.borderPath).not.toBe(c.borderPath);
    expect(a.defs).toContain('id="s1-ink"');
    expect(a.defs).toContain('id="s1-text"');
    expect(a.filters).toEqual({ ink: "url(#s1-ink)", text: "url(#s1-text)" });
    // 成本约束：每枚章最多 2 个 feTurbulence、15 个原语（不算 feFunc* 和 feMergeNode）
    expect(a.defs.split("<feTurbulence").length - 1).toBe(2);
    const primitives = a.defs.match(/<fe(?!Func|MergeNode)/g)?.length ?? 0;
    expect(primitives).toBeLessThanOrEqual(15);
    expect(a.label).toBe("水 墨");
    // 阳章边框是外圈 + 内圈两条闭合路径
    expect(a.borderPath.split("Z").filter(Boolean)).toHaveLength(2);
  });

  it("drops filters when the knobs are zero", () => {
    const r = generateStamp({ text: "水墨", id: "s2", roughness: 0, carving: 0, bleed: 0 });
    expect(r.defs).toBe("");
    expect(r.filters).toEqual({});
  });

  it("yin mode uses a solid body and cuts grid lines between columns and rows", () => {
    const r = generateStamp({
      text: ["水墨", "丹青"],
      id: "s3",
      mode: "yin",
      gridLines: true,
      shape: "square",
    });
    expect(r.borderPath.split("Z").filter(Boolean)).toHaveLength(1);
    expect(r.gridLines).toHaveLength(2);
    const [col, row] = r.gridLines;
    expect(col!.h).toBe(r.height);
    expect(row!.w).toBe(r.width);
    expect(col!.x).toBeCloseTo(r.width / 2 - col!.w / 2, 0);
    // 阳章不抠界格
    expect(generateStamp({ text: "水墨", id: "s4", gridLines: true }).gridLines).toHaveLength(0);
  });

  it("uses the measurer for column widths", () => {
    const narrow = generateStamp({
      text: ["水墨"],
      id: "s5",
      shape: "auto",
      measure: () => ({ ...FALLBACK_METRIC, w: 50, left: 25, right: 25 }),
    });
    const wide = generateStamp({
      text: ["水墨"],
      id: "s5",
      shape: "auto",
      measure: () => FALLBACK_METRIC,
    });
    expect(narrow.width).toBeLessThan(wide.width);
  });
});
