import { describe, expect, it } from "vitest";
import { applyInkVar, inkVarAttr, inkVarBindings, registerInkVar } from "./registry";

const SVG = (n: number) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Ctitle%3E${n}%3C/title%3E%3C/svg%3E`;

function sheet(): CSSStyleSheet {
  const style = document.querySelector<HTMLStyleElement>("style[data-m-ink-assets]");
  if (!style?.sheet) throw new Error("素材样式表还没建出来");
  return style.sheet;
}

function mount(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("ink registry", () => {
  it("registers the same asset once and hands out the same token", () => {
    const first = registerInkVar("--m-test-once", SVG(1));
    expect(first).not.toBeNull();
    const before = sheet().cssRules.length;
    expect(registerInkVar("--m-test-once", SVG(1))).toBe(first);
    expect(sheet().cssRules.length).toBe(before);
    expect(first!.attr).toBe(inkVarAttr("--m-test-once"));
    expect(first!.token).toMatch(/^k[0-9a-z]+/);
    // 只多一条规则，且是属性选择器
    const rule = Array.from(sheet().cssRules).find((r) =>
      r.cssText.startsWith(`[${first!.attr}="${first!.token}"]`),
    );
    expect(rule?.cssText).toContain("--m-test-once");
  });

  it("gives different assets different tokens", () => {
    const a = registerInkVar("--m-test-diff", SVG(1))!;
    const b = registerInkVar("--m-test-diff", SVG(2))!;
    expect(a.attr).toBe(b.attr);
    expect(a.token).not.toBe(b.token);
  });

  it("applies and clears the variable on an element", () => {
    const el = mount();
    applyInkVar(el, "--m-test-apply", SVG(3));
    expect(el.getAttribute(inkVarAttr("--m-test-apply"))).toMatch(/^k/);
    expect(el.style.getPropertyValue("--m-test-apply")).toBe("");
    expect(getComputedStyle(el).getPropertyValue("--m-test-apply")).toContain(SVG(3));
    // 换图：属性跟着换
    applyInkVar(el, "--m-test-apply", SVG(4));
    expect(getComputedStyle(el).getPropertyValue("--m-test-apply")).toContain(SVG(4));
    applyInkVar(el, "--m-test-apply", null);
    expect(el.hasAttribute(inkVarAttr("--m-test-apply"))).toBe(false);
    expect(getComputedStyle(el).getPropertyValue("--m-test-apply")).toBe("");
    el.remove();
  });

  it("turns a map of variables into attrs and skips undefined", () => {
    const { attrs, style } = inkVarBindings({
      "--m-test-bind-a": SVG(5),
      "--m-test-bind-b": undefined,
      "--m-test-bind-c": SVG(6),
    });
    expect(Object.keys(attrs).sort()).toEqual([
      inkVarAttr("--m-test-bind-a"),
      inkVarAttr("--m-test-bind-c"),
    ]);
    expect(style).toEqual({});
    // 挂到元素上后计算样式能读到
    const el = mount();
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    expect(getComputedStyle(el).getPropertyValue("--m-test-bind-a")).toContain(SVG(5));
    expect(getComputedStyle(el).getPropertyValue("--m-test-bind-b")).toBe("");
    el.remove();
  });
});
