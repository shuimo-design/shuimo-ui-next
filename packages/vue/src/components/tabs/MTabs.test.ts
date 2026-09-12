import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, type PropType } from "vue";
import { MTabPane, MTabs, type TabName } from ".";

afterEach(() => document.documentElement.classList.remove("m-ink-ready"));

/** 父组件真的把值写回去，连续按键才能基于新值 */
const Host = defineComponent({
  props: {
    initial: { type: [String, Number] as PropType<TabName>, default: undefined },
    extra: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    names: { type: Array as PropType<string[]>, default: () => ["shan", "shui", "yun"] },
  },
  setup(props) {
    const active = ref<TabName | undefined>(props.initial);
    const labels: Record<string, string> = { shan: "山", shui: "水", yun: "云", feng: "风" };
    return () =>
      h("div", [
        h(
          MTabs,
          {
            ...props.extra,
            modelValue: active.value,
            "onUpdate:modelValue": (v: TabName | undefined) => (active.value = v),
          },
          {
            default: () =>
              props.names.map((name) =>
                h(
                  MTabPane,
                  { name, label: labels[name], disabled: name === "yun" },
                  { default: () => `${labels[name]}的内容` },
                ),
              ),
          },
        ),
        h("output", { "data-testid": "out" }, String(active.value ?? "")),
      ]);
  },
});

describe("MTabs", () => {
  it("renders one tab per pane and shows only the active panel", async () => {
    const screen = await render(Host, { props: { initial: "shan" } });
    const tabs = screen.getByRole("tab");
    expect(tabs.elements()).toHaveLength(3);
    await expect
      .element(screen.getByRole("tab", { name: "山" }))
      .toHaveAttribute("aria-selected", "true");
    await expect.element(screen.getByText("山的内容")).toBeVisible();
    await expect.element(screen.getByText("水的内容")).not.toBeVisible();
    // tab 和 panel 用 aria 互相指着
    const tab = screen.getByRole("tab", { name: "山" }).element();
    const panel = screen.getByRole("tabpanel").element();
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
  });

  it("activates the first pane when v-model is not set", async () => {
    const screen = await render(Host);
    await expect
      .element(screen.getByRole("tab", { name: "山" }))
      .toHaveAttribute("aria-selected", "true");
  });

  it("switches through v-model on click and emits change / tabClick", async () => {
    const onChange = vi.fn();
    const onTabClick = vi.fn();
    const screen = await render(Host, {
      props: { initial: "shan", extra: { onChange, onTabClick } },
    });
    await screen.getByRole("tab", { name: "水" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await expect.element(screen.getByText("水的内容")).toBeVisible();
    expect(onChange).toHaveBeenCalledWith("shui");
    expect(onTabClick).toHaveBeenCalledWith("shui", expect.any(MouseEvent));
    // 再点已激活的：只报 tabClick，不报 change
    await screen.getByRole("tab", { name: "水" }).click();
    expect(onTabClick).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not respond on a disabled pane", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, { props: { initial: "shan", extra: { onChange } } });
    const yun = screen.getByRole("tab", { name: "云" });
    await expect.element(yun).toHaveAttribute("aria-disabled", "true");
    await yun.click({ force: true });
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not respond when the whole group is disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(Host, {
      props: { initial: "shan", extra: { disabled: true, onChange } },
    });
    const shui = screen.getByRole("tab", { name: "水" });
    await expect.element(shui).toHaveAttribute("aria-disabled", "true");
    await shui.click({ force: true });
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves with arrow keys, skipping disabled tabs, and jumps with Home / End", async () => {
    const screen = await render(Host, { props: { initial: "shan" } });
    const shan = screen.getByRole("tab", { name: "山" });
    (shan.element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await expect.element(screen.getByRole("tab", { name: "水" })).toHaveFocus();
    // 云是禁用的，再往右直接绕回山
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
    await userEvent.keyboard("{End}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await userEvent.keyboard("{Home}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shan");
  });

  it("uses up / down keys when the nav is vertical", async () => {
    const screen = await render(Host, { props: { initial: "shan", extra: { position: "left" } } });
    const list = screen.getByRole("tablist");
    await expect.element(list).toHaveAttribute("aria-orientation", "vertical");
    (screen.getByRole("tab", { name: "山" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
  });

  it("renders a lazy pane only after it is first activated", async () => {
    const screen = await render(MTabs, {
      props: { modelValue: "a" },
      slots: {
        default: () => [
          h(MTabPane, { name: "a", label: "甲" }, { default: () => "壹" }),
          h(MTabPane, { name: "b", label: "乙", lazy: true }, { default: () => "贰" }),
        ],
      },
    });
    expect(screen.container.textContent).not.toContain("贰");
    await screen.getByRole("tab", { name: "乙" }).click();
    await expect.element(screen.getByText("贰")).toBeVisible();
    await screen.getByRole("tab", { name: "甲" }).click();
    // 激活过一次就留在 DOM 里，只是藏起来
    await expect.element(screen.getByText("贰")).not.toBeVisible();
  });

  it("emits tabRemove from the close button without switching", async () => {
    const onTabRemove = vi.fn();
    const onChange = vi.fn();
    const screen = await render(Host, {
      props: { initial: "shan", extra: { closable: true, onTabRemove, onChange } },
    });
    await screen.getByRole("button", { name: "关闭 水" }).click();
    expect(onTabRemove).toHaveBeenCalledWith("shui");
    expect(onChange).not.toHaveBeenCalled();
    // 禁用的标签关不掉
    await expect.element(screen.getByRole("button", { name: "关闭 云" })).toBeDisabled();
  });

  it("falls back to a neighbor when the active pane is removed", async () => {
    const Removable = defineComponent({
      setup() {
        const active = ref<TabName | undefined>("shui");
        const names = ref(["shan", "shui", "yun"]);
        return () =>
          h("div", [
            h(
              MTabs,
              {
                modelValue: active.value,
                "onUpdate:modelValue": (v: TabName | undefined) => (active.value = v),
              },
              {
                default: () =>
                  names.value.map((name) =>
                    h(MTabPane, { key: name, name, label: name }, { default: () => name }),
                  ),
              },
            ),
            h(
              "button",
              { type: "button", onClick: () => (names.value = ["shan", "yun"]) },
              "删掉水",
            ),
            h("output", { "data-testid": "out" }, String(active.value ?? "")),
          ]);
      },
    });
    const screen = await render(Removable);
    await expect.element(screen.getByTestId("out")).toHaveTextContent("shui");
    await screen.getByRole("button", { name: "删掉水" }).click();
    await expect.element(screen.getByTestId("out")).toHaveTextContent("yun");
    expect(screen.getByRole("tab").elements()).toHaveLength(2);
  });

  it("renders the label slot and keeps nav order in sync with the DOM", async () => {
    const screen = await render(MTabs, {
      props: { modelValue: "a" },
      slots: {
        default: () => [
          h(MTabPane, { name: "a" }, { default: () => "壹", label: () => h("em", "斜体甲") }),
          h(MTabPane, { name: "b", label: "乙" }, { default: () => "贰" }),
        ],
      },
    });
    const tabs = screen.getByRole("tab").elements();
    expect(tabs[0]?.querySelector("em")?.textContent).toBe("斜体甲");
    expect(tabs[1]?.textContent).toContain("乙");
  });

  it("moves the indicator under the active tab and draws both lines with brush masks", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(Host, { props: { initial: "shan" } });
    const indicator = screen.container.querySelector<HTMLElement>(".m-tabs__indicator")!;
    const line = screen.container.querySelector<HTMLElement>(".m-tabs__line")!;
    await expect
      .poll(() => getComputedStyle(line).getPropertyValue("--m-brush-line-mask"))
      .toContain("url(");
    await expect
      .poll(() => getComputedStyle(indicator).getPropertyValue("--m-brush-line-mask"))
      .toContain("url(");
    expect(indicator.style.transform).toBe("translateX(0px)");
    const first = Number.parseFloat(indicator.style.width);
    expect(first).toBeGreaterThan(0);
    await screen.getByRole("tab", { name: "水" }).click();
    await expect.poll(() => indicator.style.transform).not.toBe("translateX(0px)");
    expect(Number.parseFloat(indicator.style.transform.replace(/[^\d.]/g, ""))).toBeCloseTo(
      first,
      0,
    );
  });

  it("switches to the card skin without the brush lines", async () => {
    const screen = await render(Host, { props: { initial: "shan", extra: { type: "card" } } });
    const root = screen.container.querySelector(".m-tabs")!;
    expect(root.classList.contains("m-tabs--card")).toBe(true);
    expect(root.querySelector(".m-tabs__line")).toBeNull();
    expect(root.querySelector(".m-tabs__indicator")).toBeNull();
    // 没开水墨引擎：不生成签条底图，也不挂笔触框
    expect(root.querySelector("[data-ink-stroke]")).toBeNull();
    expect(
      getComputedStyle(root.querySelector<HTMLElement>('[role="tab"]')!).getPropertyValue(
        "--m-tabs-slip",
      ),
    ).toBe("");
  });

  it("draws card tabs as paper slips with a three-sided brush frame on the active one", async () => {
    document.documentElement.classList.add("m-ink-ready");
    const screen = await render(Host, { props: { initial: "shan", extra: { type: "card" } } });
    const root = screen.container.querySelector<HTMLElement>(".m-tabs")!;
    const content = root.querySelector<HTMLElement>(".m-tabs__content")!;
    const tabOf = (name: string) => screen.getByRole("tab", { name }).element() as HTMLElement;
    // 内容区四面框、每条签条一张按尺寸生成的毛边底图
    await expect
      .poll(() => getComputedStyle(content).getPropertyValue("--m-ink-stroke-border"))
      .toContain("url(");
    await expect
      .poll(() => getComputedStyle(tabOf("山")).getPropertyValue("--m-tabs-slip"))
      .toContain("url(");
    expect(getComputedStyle(tabOf("水")).getPropertyValue("--m-tabs-slip")).toContain("url(");
    // 只有激活项挂笔触框；切换后框跟着走，旧的那条清掉
    await expect
      .poll(() => getComputedStyle(tabOf("山")).getPropertyValue("--m-ink-stroke-border"))
      .toContain("url(");
    expect(tabOf("水").hasAttribute("data-ink-stroke")).toBe(false);
    await tabOf("水").click();
    await expect
      .poll(() => getComputedStyle(tabOf("水")).getPropertyValue("--m-ink-stroke-border"))
      .toContain("url(");
    expect(tabOf("山").hasAttribute("data-ink-stroke")).toBe(false);
    // 激活签条朝内容区探出 2px、压在内容区上沿之上
    const active = tabOf("水").getBoundingClientRect();
    const box = content.getBoundingClientRect();
    expect(active.bottom - box.top).toBeCloseTo(2, 0);
    expect(tabOf("山").getBoundingClientRect().bottom).toBeLessThan(box.top);
  });

  it("renders the extra slot at the end of the nav", async () => {
    const screen = await render(MTabs, {
      slots: {
        default: () => [h(MTabPane, { name: "a", label: "甲" }, { default: () => "壹" })],
        extra: () => h("button", { type: "button" }, "新增"),
      },
    });
    await expect.element(screen.getByRole("button", { name: "新增" })).toBeVisible();
    expect(screen.container.querySelector(".m-tabs__extra")).not.toBeNull();
  });
});
