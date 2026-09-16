import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MSealColophon } from ".";

// 断言和 Vue 那份逐字一致；默认插槽是 children，seal 插槽是 renderSeal
describe("MSealColophon", () => {
  it("renders the note, author and date with a seal of the author's first two characters", async () => {
    const screen = await render(
      <MSealColophon author="齐白石" text="写于丙午年秋" date="2026.09" />,
    );
    const root = screen.container.querySelector(".m-seal-colophon") as HTMLElement;
    expect(root.classList.contains("m-seal-colophon--right")).toBe(true);
    expect(root.classList.contains("m-seal-colophon--vertical")).toBe(false);
    expect(root.querySelector(".m-seal-colophon__note")?.textContent).toBe("写于丙午年秋");
    expect(root.querySelector(".m-seal-colophon__author")?.textContent).toBe("齐白石");
    expect(root.querySelector(".m-seal-colophon__date")?.textContent).toBe("2026.09");
    // 印章是一枚 MStamp，印文取署名前两个字（MStamp 的 aria-label 按列用空格隔开）
    const stamp = root.querySelector(".m-stamp") as HTMLElement;
    expect(stamp.getAttribute("role")).toBe("img");
    expect(stamp.getAttribute("aria-label")?.replace(/\s/g, "")).toBe("齐白");
    expect(stamp.classList.contains("m-stamp--yang")).toBe(true);
    expect(stamp.closest(".m-seal-colophon__seal")).not.toBeNull();
  });

  it("omits the note and date when not given", async () => {
    const screen = await render(<MSealColophon author="白石" />);
    const root = screen.container.querySelector(".m-seal-colophon") as HTMLElement;
    expect(root.querySelector(".m-seal-colophon__note")).toBeNull();
    expect(root.querySelector(".m-seal-colophon__date")).toBeNull();
    expect(root.querySelector(".m-seal-colophon__author")?.textContent).toBe("白石");
  });

  it("passes seal text, shape, mode and seed through to the stamp", async () => {
    const screen = await render(
      <MSealColophon
        author="齐白石"
        seal="借山"
        sealShape="square"
        sealMode="yin"
        seed={3}
        align="left"
        vertical
      />,
    );
    const root = screen.container.querySelector(".m-seal-colophon") as HTMLElement;
    expect(root.classList.contains("m-seal-colophon--left")).toBe(true);
    expect(root.classList.contains("m-seal-colophon--vertical")).toBe(true);
    expect(getComputedStyle(root.querySelector(".m-seal-colophon__text")!).writingMode).toBe(
      "vertical-rl",
    );
    const stamp = root.querySelector(".m-stamp") as HTMLElement;
    expect(stamp.getAttribute("aria-label")?.replace(/\s/g, "")).toBe("借山");
    expect(stamp.classList.contains("m-stamp--yin")).toBe(true);
    expect(stamp.classList.contains("m-stamp--square")).toBe(true);
  });

  it("renders the same seal on every mount without a seed", async () => {
    const first = await render(<MSealColophon author="白石" />);
    const second = await render(<MSealColophon author="白石" />);
    const path = (root: HTMLElement) =>
      root.querySelector(".m-stamp__border")?.getAttribute("d") ?? "";
    expect(path(first.container)).not.toBe("");
    expect(path(first.container)).toBe(path(second.container));
  });

  it("replaces the text block and the seal with slots", async () => {
    const screen = await render(
      <MSealColophon author="白石" renderSeal={() => "〔章〕"}>
        乙巳年 白石 补记
      </MSealColophon>,
    );
    const root = screen.container.querySelector(".m-seal-colophon") as HTMLElement;
    expect(root.querySelector(".m-seal-colophon__text")?.textContent).toBe("乙巳年 白石 补记");
    expect(root.querySelector(".m-seal-colophon__author")).toBeNull();
    expect(root.querySelector(".m-seal-colophon__seal")?.textContent).toBe("〔章〕");
    expect(root.querySelector(".m-stamp")).toBeNull();
  });
});
