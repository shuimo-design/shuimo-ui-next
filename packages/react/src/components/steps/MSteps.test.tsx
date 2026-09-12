import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MStep, MSteps } from ".";
import type { StepStatus, StepsDirection } from "@shuimo-design/core";

function Demo(props: {
  initial?: number;
  direction?: StepsDirection;
  status?: StepStatus;
  simple?: boolean;
}) {
  const { initial = 1, direction = "horizontal", status = "process", simple = false } = props;
  const [active, setActive] = useState(initial);
  const [showSecond, setShowSecond] = useState(true);
  return (
    <div>
      <MSteps active={active} direction={direction} status={status} simple={simple}>
        <MStep title="磨墨" description="松烟入砚" />
        {showSecond ? <MStep title="润笔" description="饱蘸浓淡" /> : null}
        <MStep title="落纸" description="一气呵成" />
      </MSteps>
      <button onClick={() => setActive((n) => n + 1)}>下一步</button>
      <button onClick={() => setShowSecond(false)}>去掉第二步</button>
    </div>
  );
}

function stepOf(title: string, screen: { getByText: (t: string) => { element: () => Element } }) {
  return screen.getByText(title).element().closest<HTMLElement>(".m-step")!;
}

describe("MSteps", () => {
  it("infers finish / process / wait from active and numbers the nodes", async () => {
    const screen = await render(<Demo />);
    const first = stepOf("磨墨", screen);
    const second = stepOf("润笔", screen);
    const third = stepOf("落纸", screen);
    expect(first.classList.contains("m-step--finish")).toBe(true);
    expect(second.classList.contains("m-step--process")).toBe(true);
    expect(third.classList.contains("m-step--wait")).toBe(true);
    expect(second.getAttribute("aria-current")).toBe("step");
    expect(first.hasAttribute("aria-current")).toBe(false);
    // 完成的步节点里是勾，没完成的是序号
    expect(first.querySelector(".m-step__mark--check")).not.toBeNull();
    expect(second.querySelector(".m-step__number")?.textContent).toBe("2");
    expect(third.querySelector(".m-step__number")?.textContent).toBe("3");
    await expect.element(screen.getByText("松烟入砚")).toBeVisible();
  });

  it("advances when active changes", async () => {
    const screen = await render(<Demo />);
    await screen.getByRole("button", { name: "下一步" }).click();
    expect(stepOf("润笔", screen).classList.contains("m-step--finish")).toBe(true);
    expect(stepOf("落纸", screen).classList.contains("m-step--process")).toBe(true);
    await screen.getByRole("button", { name: "下一步" }).click();
    expect(stepOf("落纸", screen).classList.contains("m-step--finish")).toBe(true);
  });

  it("uses the group status for the active step and shows a cross on error", async () => {
    const screen = await render(<Demo status="error" />);
    const second = stepOf("润笔", screen);
    expect(second.classList.contains("m-step--error")).toBe(true);
    expect(second.querySelector(".m-step__mark--cross")).not.toBeNull();
    // 前一步不受影响，仍是完成
    expect(stepOf("磨墨", screen).classList.contains("m-step--finish")).toBe(true);
  });

  it("lets a step override its own status", async () => {
    const screen = await render(
      <MSteps active={0}>
        <MStep title="甲" />
        <MStep title="乙" status="finish" />
        <MStep title="丙" />
      </MSteps>,
    );
    expect(stepOf("乙", screen).classList.contains("m-step--finish")).toBe(true);
    expect(stepOf("丙", screen).classList.contains("m-step--wait")).toBe(true);
  });

  it("draws a brush line after every step except the last", async () => {
    const screen = await render(<Demo />);
    const first = stepOf("磨墨", screen);
    const last = stepOf("落纸", screen);
    const line = first.querySelector<HTMLElement>(".m-step__line");
    expect(line).not.toBeNull();
    // 线按实际长度单独生成，量出长度后会把遮罩写进自己的 CSS 变量
    await expect
      .poll(() => line && getComputedStyle(line).getPropertyValue("--m-brush-line-mask"))
      .toContain("url(");
    expect(last.classList.contains("m-step--last")).toBe(true);
    expect(last.querySelector(".m-step__line")).toBeNull();
  });

  it("stacks vertically and generates vertical lines", async () => {
    const screen = await render(<Demo direction="vertical" />);
    const steps = stepOf("磨墨", screen).closest(".m-steps")!;
    expect(steps.classList.contains("m-steps--vertical")).toBe(true);
    const line = stepOf("磨墨", screen).querySelector<HTMLElement>(".m-step__line")!;
    await expect.poll(() => line.style.getPropertyValue("--m-brush-line-band")).toMatch(/px$/);
    const rect = line.getBoundingClientRect();
    expect(rect.height).toBeGreaterThan(rect.width);
  });

  it("hides descriptions in simple mode", async () => {
    const screen = await render(<Demo simple />);
    const steps = stepOf("磨墨", screen).closest(".m-steps")!;
    expect(steps.classList.contains("m-steps--simple")).toBe(true);
    await expect.element(screen.getByText("松烟入砚")).not.toBeVisible();
  });

  it("renumbers the remaining steps when one unmounts", async () => {
    const screen = await render(<Demo />);
    await screen.getByRole("button", { name: "去掉第二步" }).click();
    const last = stepOf("落纸", screen);
    expect(last.querySelector(".m-step__number")?.textContent).toBe("2");
    expect(last.classList.contains("m-step--process")).toBe(true);
    expect(stepOf("磨墨", screen).classList.contains("m-step--finish")).toBe(true);
  });

  it("renders icon and node content", async () => {
    const screen = await render(
      <MSteps active={0}>
        <MStep
          title="定制"
          icon={<span className="custom-icon">印</span>}
          descriptionNode={<em>自定义描述</em>}
        />
      </MSteps>,
    );
    const step = stepOf("定制", screen);
    expect(step.querySelector(".custom-icon")?.textContent).toBe("印");
    expect(step.querySelector(".m-step__number")).toBeNull();
    await expect.element(screen.getByText("自定义描述")).toBeVisible();
  });

  it("works standalone as a single wait step", async () => {
    const screen = await render(<MStep title="独步" />);
    const step = stepOf("独步", screen);
    expect(step.classList.contains("m-step--wait")).toBe(true);
    expect(step.classList.contains("m-step--last")).toBe(true);
    expect(step.querySelector(".m-step__number")?.textContent).toBe("1");
  });
});
