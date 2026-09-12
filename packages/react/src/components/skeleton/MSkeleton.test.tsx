import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MSkeleton, MSkeletonItem } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

// 断言和 Vue 那份逐字一致；Vue 的 template 插槽在这边是 template 属性
describe("MSkeleton", () => {
  it("renders a title and three text rows by default", async () => {
    const screen = await render(<MSkeleton />);
    const root = screen.container.querySelector<HTMLElement>(".m-skeleton")!;
    expect(root.getAttribute("aria-busy")).toBe("true");
    expect(root.querySelector(".m-skeleton__title")).not.toBeNull();
    expect(root.querySelectorAll(".m-skeleton__row").length).toBe(3);
    expect(root.querySelector(".m-skeleton__avatar")).toBeNull();
    // 最后一行短一截
    const rows = root.querySelectorAll<HTMLElement>(".m-skeleton__row");
    const last = rows[rows.length - 1]!;
    expect(last.getBoundingClientRect().width).toBeLessThan(rows[0]!.getBoundingClientRect().width);
  });

  it("honours avatar, rows and title", async () => {
    const screen = await render(<MSkeleton avatar rows={5} title={false} />);
    const root = screen.container.querySelector<HTMLElement>(".m-skeleton")!;
    const avatar = root.querySelector<HTMLElement>(".m-skeleton__avatar")!;
    expect(avatar.classList.contains("m-skeleton-item--circle")).toBe(true);
    expect(root.querySelector(".m-skeleton__title")).toBeNull();
    expect(root.querySelectorAll(".m-skeleton__row").length).toBe(5);
  });

  it("renders the real content once loading is off", async () => {
    const screen = await render(
      <MSkeleton loading={false}>
        <p>山水有清音</p>
      </MSkeleton>,
    );
    await expect.element(screen.getByText("山水有清音")).toBeVisible();
    expect(screen.container.querySelector(".m-skeleton")).toBeNull();
  });

  it("switches between skeleton and content when loading changes", async () => {
    const screen = await render(
      <MSkeleton loading>
        <p>真实内容</p>
      </MSkeleton>,
    );
    expect(screen.container.querySelector(".m-skeleton")).not.toBeNull();
    await screen.rerender(
      <MSkeleton loading={false}>
        <p>真实内容</p>
      </MSkeleton>,
    );
    await expect.element(screen.getByText("真实内容")).toBeVisible();
    expect(screen.container.querySelector(".m-skeleton")).toBeNull();
  });

  it("waits for throttle before showing the skeleton", async () => {
    const screen = await render(
      <MSkeleton loading throttle={120}>
        <p>真实内容</p>
      </MSkeleton>,
    );
    // 等待窗口内既没有骨架也没有真实内容
    expect(screen.container.querySelector(".m-skeleton")).toBeNull();
    expect(screen.container.textContent).not.toContain("真实内容");
    await expect.poll(() => screen.container.querySelector(".m-skeleton")).not.toBeNull();
  });

  it("uses the template slot for custom layouts", async () => {
    const screen = await render(
      <MSkeleton
        template={
          <>
            <MSkeletonItem variant="image" />
            <MSkeletonItem variant="h1" />
            <MSkeletonItem variant="button" />
          </>
        }
      />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-skeleton")!;
    expect(root.querySelector(".m-skeleton__default")).toBeNull();
    expect(root.querySelector(".m-skeleton-item--image .m-skeleton-item__icon")).not.toBeNull();
    expect(root.querySelector(".m-skeleton-item--h1")).not.toBeNull();
    expect(root.querySelector(".m-skeleton-item--button")).not.toBeNull();
  });

  it("runs the shine only when animated", async () => {
    const screen = await render(<MSkeleton animated />);
    const root = screen.container.querySelector<HTMLElement>(".m-skeleton")!;
    expect(root.classList.contains("m-skeleton--animated")).toBe(true);
    const row = root.querySelector<HTMLElement>(".m-skeleton__row")!;
    expect(getComputedStyle(row, "::after").animationName).toBe("m-skeleton-shine");
    await screen.rerender(<MSkeleton animated={false} />);
    expect(getComputedStyle(row, "::after").animationName).toBe("none");
  });

  it("fades both ends of a text row under m-ink-ready", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(<MSkeleton />);
    const row = screen.container.querySelector<HTMLElement>(".m-skeleton__row")!;
    expect(getComputedStyle(row).maskImage).toContain("linear-gradient");
    expect(getComputedStyle(row).filter).toBe("none");
  });
});

describe("MSkeletonItem", () => {
  it("renders each variant with its own size", async () => {
    const screen = await render(<MSkeletonItem variant="circle" />);
    const item = screen.container.querySelector<HTMLElement>(".m-skeleton-item")!;
    expect(item.classList.contains("m-skeleton-item--circle")).toBe(true);
    const rect = item.getBoundingClientRect();
    expect(rect.width).toBe(40);
    expect(rect.height).toBe(40);
    expect(item.getAttribute("aria-hidden")).toBe("true");
  });
});
