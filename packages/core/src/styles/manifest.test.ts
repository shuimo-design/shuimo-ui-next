import { describe, expect, it } from "vitest";
import { COMPONENT_STYLES, isStyledComponent, STYLE_BASE, styleFilesOf } from "./manifest";

describe("styleFilesOf", () => {
  it("puts base first and the component's own css last", () => {
    expect(styleFilesOf("MButton")).toEqual([STYLE_BASE, "button"]);
  });

  it("pulls in shared blocks and rendered components before the component itself", () => {
    expect(styleFilesOf("MDialog")).toEqual([STYLE_BASE, "modal-ink", "dialog"]);
    // MSelect 渲染 MTag，分页又渲染 MInput 和 MSelect：闭包要展开，且顺序是"被依赖的在前"
    expect(styleFilesOf("MPagination")).toEqual([
      STYLE_BASE,
      "input",
      "popper",
      "tag",
      "select",
      "pagination",
    ]);
  });

  it("does not repeat a file reached through two paths", () => {
    // MConfigProvider → MOverlayOutlet → MConfirm → MButton；每份只出现一次
    const files = styleFilesOf("MConfigProvider");
    expect(new Set(files).size).toBe(files.length);
    expect(files).toContain("confirm");
    expect(files).toContain("message");
    expect(files).toContain("button");
  });

  it("only needs base for components whose styles live in the base bundle", () => {
    expect(styleFilesOf("MInkTransition")).toEqual([STYLE_BASE]);
  });

  it("every entry resolves without throwing and starts with base", () => {
    for (const name of Object.keys(COMPONENT_STYLES)) {
      expect(isStyledComponent(name)).toBe(true);
      if (isStyledComponent(name)) expect(styleFilesOf(name)[0]).toBe(STYLE_BASE);
    }
    expect(isStyledComponent("MIconClose")).toBe(false);
  });
});
