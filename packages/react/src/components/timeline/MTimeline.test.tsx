import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MTimeline, MTimelineItem, type TimelineItem } from ".";

const events: TimelineItem[] = [
  { key: "a", label: "辰时", content: "磨墨" },
  { key: "b", label: "巳时", content: "润笔", type: "primary" },
  { key: "c", label: "午时", content: "落纸", type: "danger" },
];

function Demo() {
  const [items, setItems] = useState<TimelineItem[]>([...events]);
  const [reverse, setReverse] = useState(false);
  return (
    <div>
      <MTimeline items={items} pending="进行中" reverse={reverse} />
      <button onClick={() => setItems((prev) => [...prev, { label: "申时", content: "钤印" }])}>
        追加
      </button>
      <button onClick={() => setReverse((v) => !v)}>倒序</button>
    </div>
  );
}

function itemsOf(container: Element): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(".m-timeline-item")];
}

describe("MTimeline", () => {
  it("renders one item per entry with label, content and type", async () => {
    const screen = await render(<MTimeline items={events} />);
    const list = screen.container.querySelector("ol.m-timeline")!;
    expect(list.classList.contains("m-timeline--left")).toBe(true);
    const items = itemsOf(screen.container);
    expect(items).toHaveLength(3);
    expect(items[0]!.querySelector(".m-timeline-item__label")?.textContent).toBe("辰时");
    expect(items[0]!.querySelector(".m-timeline-item__content")?.textContent?.trim()).toBe("磨墨");
    expect(items[1]!.classList.contains("m-timeline-item--primary")).toBe(true);
    expect(items[2]!.classList.contains("m-timeline-item--danger")).toBe(true);
    // left 模式内容都在轴线右边；墨点里没有字
    expect(items.every((el) => el.classList.contains("m-timeline-item--right"))).toBe(true);
    expect(items[0]!.querySelector(".m-timeline-item__node")?.textContent).toBe("");
    // 只有最后一条是 last
    expect(items[2]!.classList.contains("m-timeline-item--last")).toBe(true);
    expect(items[1]!.classList.contains("m-timeline-item--last")).toBe(false);
  });

  it("puts content on the left in right mode and alternates in alternate mode", async () => {
    const right = await render(<MTimeline items={events} mode="right" />);
    expect(
      itemsOf(right.container).every((el) => el.classList.contains("m-timeline-item--left")),
    ).toBe(true);
    const alt = await render(<MTimeline items={events} mode="alternate" />);
    const sides = itemsOf(alt.container).map((el) =>
      el.classList.contains("m-timeline-item--left") ? "left" : "right",
    );
    expect(sides).toEqual(["left", "right", "left"]);
  });

  it("adds a ghost node with a dashed segment for pending and moves it first when reversed", async () => {
    const screen = await render(<Demo />);
    let items = itemsOf(screen.container);
    expect(items).toHaveLength(4);
    const ghost = items[3]!;
    expect(ghost.classList.contains("m-timeline-item--pending")).toBe(true);
    expect(ghost.classList.contains("m-timeline-item--last")).toBe(true);
    expect(ghost.querySelector(".m-timeline-item__content")?.textContent?.trim()).toBe("进行中");
    // 实心轴线跨前三行，虚线段接在第三行到第四行之间
    const axis = screen.container.querySelector<HTMLElement>(
      ".m-timeline__axis:not(.m-timeline__axis--pending)",
    )!;
    const dashed = screen.container.querySelector<HTMLElement>(".m-timeline__axis--pending")!;
    expect(axis.style.gridRow).toBe("1 / 3");
    expect(dashed.style.gridRow).toBe("3 / 4");

    await screen.getByRole("button", { name: "倒序" }).click();
    items = itemsOf(screen.container);
    expect(items[0]!.classList.contains("m-timeline-item--pending")).toBe(true);
    expect(items[1]!.querySelector(".m-timeline-item__label")?.textContent).toBe("午时");
    expect(items[3]!.querySelector(".m-timeline-item__label")?.textContent).toBe("辰时");
    expect(items[3]!.classList.contains("m-timeline-item--last")).toBe(true);
    expect(axis.style.gridRow).toBe("2 / 4");
    expect(dashed.style.gridRow).toBe("1 / 2");
  });

  it("re-renders when items change", async () => {
    const screen = await render(<Demo />);
    await screen.getByRole("button", { name: "追加" }).click();
    const items = itemsOf(screen.container);
    expect(items).toHaveLength(5);
    expect(items[3]!.querySelector(".m-timeline-item__label")?.textContent).toBe("申时");
    expect(items[4]!.classList.contains("m-timeline-item--pending")).toBe(true);
  });

  it("collects MTimelineItem children in written order with their nodes", async () => {
    const screen = await render(
      <MTimeline>
        <MTimelineItem label="庚子" type="muted">
          <strong>初学</strong>
        </MTimelineItem>
        <MTimelineItem label="辛丑" content="始画山水" dot="二" />
        <MTimelineItem key="yin" label="壬寅" dotNode={<i className="seal">印</i>}>
          第一次刻印
        </MTimelineItem>
      </MTimeline>,
    );
    const items = itemsOf(screen.container);
    expect(items).toHaveLength(3);
    expect(items[0]!.classList.contains("m-timeline-item--muted")).toBe(true);
    expect(items[0]!.querySelector("strong")?.textContent).toBe("初学");
    // children 替换整条内容，label 不再单独渲染
    expect(items[0]!.querySelector(".m-timeline-item__label")).toBeNull();
    expect(items[1]!.classList.contains("m-timeline-item--ring")).toBe(true);
    expect(items[1]!.querySelector(".m-timeline-item__node")?.textContent).toBe("二");
    expect(items[2]!.querySelector(".m-timeline-item__node .seal")?.textContent).toBe("印");
    expect(items[2]!.textContent).toContain("第一次刻印");
    expect(items[0]!.classList.contains("m-timeline-item--ring")).toBe(false);
  });

  it("renders renderDot and renderItem for every entry", async () => {
    const screen = await render(
      <MTimeline
        items={events}
        renderDot={({ index }) => String(index + 1)}
        renderItem={({ item }) => <em>{`${item.label}·${item.content}`}</em>}
      />,
    );
    const items = itemsOf(screen.container);
    expect(items.every((el) => el.classList.contains("m-timeline-item--ring"))).toBe(true);
    expect(items[1]!.querySelector(".m-timeline-item__node")?.textContent).toBe("2");
    expect(items[2]!.querySelector("em")?.textContent).toBe("午时·落纸");
  });

  it("spans the axis from the first node centre to the last real node centre", async () => {
    const screen = await render(<MTimeline items={events} pending="进行中" />);
    const nodes = itemsOf(screen.container).map((el) =>
      el.querySelector<HTMLElement>(".m-timeline-item__node")!.getBoundingClientRect(),
    );
    const axis = screen.container
      .querySelector<HTMLElement>(".m-timeline__axis:not(.m-timeline__axis--pending)")!
      .getBoundingClientRect();
    const dashed = screen.container
      .querySelector<HTMLElement>(".m-timeline__axis--pending")!
      .getBoundingClientRect();
    const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    // 实心轴线：第一个节点圆心 → 最后一个真实节点圆心；虚线段接着到幽灵节点圆心；都和节点同一竖线
    expect(axis.top).toBeCloseTo(centre(nodes[0]!).y, 0);
    expect(axis.bottom).toBeCloseTo(centre(nodes[2]!).y, 0);
    expect(dashed.top).toBeCloseTo(centre(nodes[2]!).y, 0);
    expect(dashed.bottom).toBeCloseTo(centre(nodes[3]!).y, 0);
    expect(centre(axis).x).toBeCloseTo(centre(nodes[0]!).x, 0);
    // 各条真的一行一行往下排
    expect(nodes[1]!.top).toBeGreaterThan(nodes[0]!.bottom);
    expect(nodes[2]!.top).toBeGreaterThan(nodes[1]!.bottom);
  });

  it("draws one vertical brush axis across the nodes and none for a single item", async () => {
    const screen = await render(<MTimeline items={events} />);
    const axis = screen.container.querySelector<HTMLElement>(".m-timeline__axis")!;
    expect(axis).not.toBeNull();
    expect(axis.getAttribute("aria-hidden")).toBe("true");
    // 轴线按实际高度单独生成，量出长度后会把遮罩写进自己的 CSS 变量
    await expect
      .poll(() => getComputedStyle(axis).getPropertyValue("--m-brush-line-mask"))
      .toContain("url(");
    await expect.poll(() => axis.style.getPropertyValue("--m-brush-line-band")).toMatch(/px$/);
    const rect = axis.getBoundingClientRect();
    expect(rect.height).toBeGreaterThan(rect.width);

    const single = await render(<MTimeline items={events.slice(0, 1)} />);
    expect(single.container.querySelector(".m-timeline__axis")).toBeNull();
  });
});
