import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MCarousel, MCarouselItem, type MCarouselProps, type ReactCarouselItem } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

const NAMES = ["山", "水", "云"];

/** 父组件真的把值写回去，连续按键才能基于新值 */
function Host(props: {
  initial?: number;
  extra?: Partial<MCarouselProps>;
  /** 用数据数组而不是子组件写法 */
  asItems?: boolean;
}) {
  const [current, setCurrent] = useState(props.initial ?? 0);
  const items: ReactCarouselItem[] = NAMES.map((name) => ({
    key: name,
    render: () => <p>{`${name}的内容`}</p>,
  }));
  return (
    <div>
      <MCarousel
        {...props.extra}
        current={current}
        onCurrentChange={setCurrent}
        items={props.asItems ? items : undefined}
      >
        {props.asItems
          ? null
          : NAMES.map((name) => (
              <MCarouselItem key={name}>
                <p>{`${name}的内容`}</p>
              </MCarouselItem>
            ))}
      </MCarousel>
      <output data-testid="out">{String(current)}</output>
    </div>
  );
}

/** 当前在 DOM 里的幻灯片（过渡中出去的那张带 leave 类名，不算） */
function slides(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(".m-carousel__slide")].filter(
    (el) => !el.classList.contains("m-carousel-slide-leave-active"),
  );
}

describe("MCarousel", () => {
  it("renders only the current slide with region / slide semantics and one dot per item", async () => {
    const screen = await render(<Host />);
    const region = screen.getByRole("region", { name: "走马灯" });
    await expect.element(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(slides(screen.container)).toHaveLength(1);
    await expect.element(screen.getByText("山的内容")).toBeVisible();
    expect(screen.container.textContent).not.toContain("水的内容");
    const slide = screen.getByRole("group", { name: "第 1 张，共 3 张" });
    await expect.element(slide).toHaveAttribute("aria-roledescription", "slide");
    expect(screen.container.querySelectorAll(".m-carousel__dot")).toHaveLength(3);
    await expect
      .element(screen.getByRole("button", { name: "第 1 张" }))
      .toHaveAttribute("aria-current", "true");
    // 服务端同款：没有任何过渡类名和 transform
    expect(slides(screen.container)[0]!.style.transform).toBe("");
  });

  it("switches through current from the arrows and dots and calls onChange", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host extra={{ onChange }} />);
    await screen.getByRole("button", { name: "下一张" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("1");
    await expect.element(screen.getByText("水的内容")).toBeVisible();
    expect(onChange).toHaveBeenCalledWith(1, 0);
    await screen.getByRole("button", { name: "第 3 张" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2");
    expect(onChange).toHaveBeenLastCalledWith(2, 1);
    // loop 默认开：最后一张再往后回到第一张
    await screen.getByRole("button", { name: "下一张" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0");
    expect(onChange).toHaveBeenLastCalledWith(0, 2);
    // 过渡播完只剩当前那张
    await vi.waitFor(() =>
      expect(screen.container.querySelectorAll(".m-carousel__slide")).toHaveLength(1),
    );
  });

  it("disables the edge arrows when loop is off", async () => {
    const onChange = vi.fn();
    const screen = await render(<Host extra={{ loop: false, onChange }} />);
    const prev = screen.getByRole("button", { name: "上一张" });
    await expect.element(prev).toBeDisabled();
    await prev.click({ force: true });
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0");
    expect(onChange).not.toHaveBeenCalled();
    await screen.getByRole("button", { name: "第 3 张" }).click();
    await expect.element(screen.getByRole("button", { name: "下一张" })).toBeDisabled();
  });

  it("moves with arrow keys on the focused region and jumps with Home / End", async () => {
    const screen = await render(<Host extra={{ loop: false }} />);
    (screen.getByRole("region", { name: "走马灯" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("1");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0");
    await userEvent.keyboard("{End}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2");
    // 不 loop 到头：不动
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("2");
    await userEvent.keyboard("{Home}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0");
    // 上下键归页面
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("0");
  });

  it("uses up / down keys when vertical", async () => {
    const screen = await render(<Host extra={{ direction: "vertical" }} />);
    await expect
      .element(screen.getByRole("region", { name: "走马灯" }))
      .toHaveClass("m-carousel--vertical");
    (screen.getByRole("region", { name: "走马灯" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("1");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("1");
  });

  it("autoplays, pauses while hovered and resumes after", async () => {
    const screen = await render(<Host extra={{ autoplay: 120 }} />);
    // 上一个用例点过的位置可能正压在走马灯上，先把鼠标挪开，否则一直算悬停
    await userEvent.hover(screen.getByTestId("out"));
    await expect.element(screen.getByTestId("out"), { timeout: 2000 }).toHaveTextContent("1");
    await expect.element(screen.getByTestId("out"), { timeout: 2000 }).toHaveTextContent("2");
    // 悬停：停下
    await screen.getByRole("region", { name: "走马灯" }).hover();
    const paused = screen.getByTestId("out").element().textContent;
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.getByTestId("out").element().textContent).toBe(paused);
    expect(screen.container.querySelector(".m-carousel__track")!.getAttribute("aria-live")).toBe(
      "polite",
    );
    // 移开：接着走
    await userEvent.unhover(screen.getByRole("region", { name: "走马灯" }));
    await vi.waitFor(
      () => expect(screen.getByTestId("out").element().textContent).not.toBe(paused),
      { timeout: 2000 },
    );
  });

  it("does not render arrows / dots when turned off or with a single slide", async () => {
    const screen = await render(
      <MCarousel arrows="none" indicator="none" items={[{ key: "a", src: "/a.png", alt: "甲" }]} />,
    );
    expect(screen.container.querySelector(".m-carousel__arrow")).toBeNull();
    expect(screen.container.querySelector(".m-carousel__dots")).toBeNull();
    await expect.element(screen.getByRole("img", { name: "甲" })).toBeInTheDocument();
    expect(screen.container.querySelector(".m-carousel")).toHaveClass("m-carousel--arrows-none");
  });

  it("takes items as data, writes height and the seeded dot into variables", async () => {
    const screen = await render(<Host asItems initial={1} extra={{ height: 160, seed: 7 }} />);
    await expect.element(screen.getByText("水的内容")).toBeVisible();
    const root = screen.container.querySelector<HTMLElement>(".m-carousel")!;
    expect(root.style.getPropertyValue("--m-carousel-h")).toBe("160px");
    expect(root.style.getPropertyValue("--m-carousel-dot")).toContain("data:image/svg+xml");
    expect(root.style.getPropertyValue("--m-carousel-dir")).toBe("1");
    // 往前翻：方向变量翻成 -1
    await screen.getByRole("button", { name: "上一张" }).click();
    await expect.poll(() => root.style.getPropertyValue("--m-carousel-dir")).toBe("-1");
  });

  it("works uncontrolled with defaultCurrent", async () => {
    const screen = await render(
      <MCarousel defaultCurrent={2}>
        <MCarouselItem>壹</MCarouselItem>
        <MCarouselItem>贰</MCarouselItem>
        <MCarouselItem>叁</MCarouselItem>
      </MCarousel>,
    );
    await expect.element(screen.getByText("叁")).toBeVisible();
    await screen.getByRole("button", { name: "第 1 张" }).click();
    await expect.element(screen.getByText("壹")).toBeVisible();
  });
});
