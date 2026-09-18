import { describe, expect, it } from "vitest";
import {
  activeAnchorHref,
  anchorClasses,
  anchorIndicatorStyle,
  anchorItemStyle,
  anchorLinkClasses,
  anchorStyle,
  anchorTargetId,
  flattenAnchorItems,
  resolveAnchorContainer,
  type AnchorItem,
} from ".";

const ITEMS: AnchorItem[] = [
  { href: "#a", title: "甲" },
  {
    href: "#b",
    title: "乙",
    children: [
      { href: "#b-1", title: "乙一" },
      { href: "#b-2", title: "乙二", children: [{ href: "#b-2-x", title: "乙二之一" }] },
    ],
  },
  { href: "#c", title: "丙" },
];

describe("anchor pure functions", () => {
  it("flattens nested items in document order with their level", () => {
    const flat = flattenAnchorItems(ITEMS);
    expect(flat.map((e) => [e.key, e.level])).toEqual([
      ["#a", 0],
      ["#b", 0],
      ["#b-1", 1],
      ["#b-2", 1],
      ["#b-2-x", 2],
      ["#c", 0],
    ]);
    expect(flat[2]!.item.title).toBe("乙一");
  });

  it("derives classes and variables", () => {
    expect(anchorClasses({ direction: "vertical", affix: false })).toEqual([
      "m-anchor",
      "m-anchor--vertical",
    ]);
    expect(anchorClasses({ direction: "horizontal", affix: true })).toEqual([
      "m-anchor",
      "m-anchor--horizontal",
      "m-anchor--affix",
    ]);
    expect(anchorStyle({ affix: true, offset: 64 })).toEqual({ "--m-anchor-top": "64px" });
    expect(anchorStyle({ affix: false, offset: 64 })).toEqual({});
    expect(anchorLinkClasses(true)).toEqual(["m-anchor__link", "m-anchor__link--active"]);
    expect(anchorLinkClasses(false)).toEqual(["m-anchor__link"]);
    expect(anchorItemStyle(2)).toEqual({ "--m-anchor-level": "2" });
  });

  it("turns an href into the target id", () => {
    expect(anchorTargetId("#intro")).toBe("intro");
    expect(anchorTargetId("intro")).toBe("intro");
    expect(anchorTargetId("#%E5%B1%B1")).toBe("山");
    // 坏编码原样返回，不抛
    expect(anchorTargetId("#%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("activates the last anchor whose top crossed the offset", () => {
    const positions = [
      { href: "#a", top: -300 },
      { href: "#b", top: -20 },
      { href: "#c", top: 150 },
    ];
    expect(activeAnchorHref(positions, { offset: 0, atBottom: false })).toBe("#b");
    // offset 往下挪：丙也算越过了
    expect(activeAnchorHref(positions, { offset: 160, atBottom: false })).toBe("#c");
    // 一个都没到：空串
    expect(activeAnchorHref([{ href: "#a", top: 40 }], { offset: 0, atBottom: false })).toBe("");
    // 1px 容差：浏览器对齐滚动位置时常差不到 1px
    expect(activeAnchorHref([{ href: "#a", top: 0.6 }], { offset: 0, atBottom: false })).toBe("#a");
    // 滚到底：最后一个点亮，哪怕它没越过
    expect(activeAnchorHref(positions, { offset: 0, atBottom: true })).toBe("#c");
    expect(activeAnchorHref([], { offset: 0, atBottom: true })).toBe("");
  });

  it("styles the indicator along the axis", () => {
    expect(anchorIndicatorStyle({ size: 24, offset: 48 }, false)).toEqual({
      height: "24px",
      transform: "translateY(48px)",
    });
    expect(anchorIndicatorStyle({ size: 80, offset: 120 }, true)).toEqual({
      width: "80px",
      transform: "translateX(120px)",
    });
  });

  it("resolves nothing on the server", () => {
    expect(resolveAnchorContainer(undefined)).toBeNull();
    expect(resolveAnchorContainer("#box")).toBeNull();
  });
});
