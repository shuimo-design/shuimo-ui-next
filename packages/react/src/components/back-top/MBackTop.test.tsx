import type { MouseEvent, ReactNode } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MBackTop, type MBackTopProps } from ".";

/** 一个 200px 高、内容 2000px 的滚动盒子，按钮盯着它 */
function Host({
  backTopProps,
  onClick,
  children,
}: {
  backTopProps?: Partial<MBackTopProps>;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}) {
  return (
    <div>
      <div id="box" style={{ height: 200, overflow: "auto" }}>
        <div style={{ height: 2000 }}>很长的内容</div>
      </div>
      <MBackTop target="#box" visibilityHeight={100} {...backTopProps} onClick={onClick}>
        {children}
      </MBackTop>
    </div>
  );
}

function box(): HTMLElement {
  return document.querySelector<HTMLElement>("#box")!;
}

/** 滚到某个位置：真浏览器会在下一帧派发 scroll 事件，不用手动 dispatch */
function scrollBoxTo(top: number) {
  box().scrollTop = top;
}

describe("MBackTop", () => {
  it("stays hidden until the target scrolls past visibilityHeight, then appears and scrolls back", async () => {
    const onClick = vi.fn();
    const screen = await render(<Host onClick={onClick} />);
    expect(document.querySelector(".m-back-top")).toBeNull();

    scrollBoxTo(50);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(document.querySelector(".m-back-top")).toBeNull();

    scrollBoxTo(600);
    const button = screen.getByRole("button", { name: "回到顶部" });
    await expect.element(button).toBeVisible();
    // 传送到 body，不在宿主里
    expect(screen.container.querySelector(".m-back-top")).toBeNull();
    expect(document.body.contains(button.element())).toBe(true);
    // 默认内容是一枚印文「顶」的印
    expect(button.element().querySelector(".m-stamp")).not.toBeNull();
    expect(button.element().getAttribute("type")).toBe("button");

    await button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(box().scrollTop).toBe(0), { timeout: 3000 });
    await expect.element(button).not.toBeInTheDocument();
  });

  it("puts right / bottom into the position variables, px for numbers and as-is for strings", async () => {
    await render(<Host backTopProps={{ right: 24, bottom: "10vh" }} />);
    scrollBoxTo(600);
    await vi.waitFor(() => expect(document.querySelector(".m-back-top")).not.toBeNull());
    const el = document.querySelector<HTMLElement>(".m-back-top")!;
    expect(el.style.getPropertyValue("--m-back-top-right")).toBe("24px");
    expect(el.style.getPropertyValue("--m-back-top-bottom")).toBe("10vh");
  });

  it("scrolls back from the keyboard", async () => {
    const screen = await render(<Host />);
    scrollBoxTo(600);
    const button = screen.getByRole("button", { name: "回到顶部" });
    await expect.element(button).toBeVisible();
    (button.element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(box().scrollTop).toBe(0), { timeout: 3000 });
  });

  it("renders the children instead of the stamp and accepts a function target", async () => {
    const screen = await render(
      <Host backTopProps={{ target: () => document.querySelector<HTMLElement>("#box")! }}>
        ↑ 顶
      </Host>,
    );
    scrollBoxTo(600);
    const button = screen.getByRole("button", { name: "回到顶部" });
    await expect.element(button).toHaveTextContent("↑ 顶");
    await expect.element(button).toHaveClass("m-back-top--custom");
    expect(button.element().querySelector(".m-stamp")).toBeNull();
  });
});
