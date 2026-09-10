import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MAlert } from ".";

// Vue Test Utils 默认把 <Transition> 桩掉，这里要真的跑收起过渡
const global = { stubs: { transition: false } };

describe("MAlert", () => {
  it("renders title, description and the type / effect classes", async () => {
    const screen = await render(MAlert, {
      props: { type: "success", effect: "dark", title: "已保存", description: "三秒后回到列表" },
    });
    const root = screen.getByRole("alert").element();
    expect(root.classList.contains("m-alert--success")).toBe(true);
    expect(root.classList.contains("m-alert--dark")).toBe(true);
    expect(root.classList.contains("m-alert--with-title")).toBe(true);
    await expect.element(screen.getByText("已保存")).toBeVisible();
    await expect.element(screen.getByText("三秒后回到列表")).toBeVisible();
  });

  it("draws the badge as a mask and a brush line sized to its height", async () => {
    const screen = await render(MAlert, { props: { type: "danger", title: "出错了" } });
    const root = screen.getByRole("alert").element() as HTMLElement;
    expect(root.style.getPropertyValue("--m-alert-badge")).toMatch(/^url\("data:image\/svg\+xml/);
    expect(root.querySelector(".m-alert__icon")).not.toBeNull();
    const bar = root.querySelector<HTMLElement>(".m-alert__bar")!;
    // 等 ResizeObserver 报一次尺寸，竖线按实际高度生成后写进自己的变量
    await expect
      .poll(() => getComputedStyle(bar).getPropertyValue("--m-brush-line-mask"))
      .toContain("url(");
    expect(bar.style.getPropertyValue("--m-brush-line-band")).toMatch(/px$/);
  });

  it("hides the icon and close button on demand and renders action / icon slots", async () => {
    const screen = await render(MAlert, {
      props: { title: "静音", showIcon: false, closable: false },
      slots: { action: () => h("a", { href: "#" }, "查看") },
    });
    const root = screen.getByRole("alert").element();
    expect(root.querySelector(".m-alert__icon")).toBeNull();
    expect(root.querySelector(".m-alert__close")).toBeNull();
    await expect.element(screen.getByRole("link", { name: "查看" })).toBeVisible();

    const custom = await render(MAlert, {
      props: { title: "自定义" },
      slots: { icon: () => h("i", { "data-testid": "ico" }, "★") },
    });
    expect(custom.container.querySelector(".m-alert__icon--custom")).not.toBeNull();
    expect(custom.container.querySelector('[data-testid="ico"]')).not.toBeNull();
  });

  it("emits close and hides itself after the collapse transition", async () => {
    const onClose = vi.fn();
    const screen = await render(MAlert, {
      props: { title: "可关", description: "点右边的叉", onClose },
      global,
    });
    const root = screen.getByRole("alert").element() as HTMLElement;
    await expect.element(root).toBeVisible();
    await screen.getByRole("button", { name: "关闭" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    // 过渡结束后 v-show 才真正 display:none
    await vi.waitFor(() => expect(getComputedStyle(root).display).toBe("none"), {
      timeout: 3000,
    });
    // 收起时临时钉上的高度要清掉，再显示时才能撑回原样
    expect(root.style.height).toBe("");
  });

  it("uses the default slot as description and centers when asked", async () => {
    const screen = await render(MAlert, {
      props: { center: true },
      slots: { default: () => "只有一行说明" },
    });
    const root = screen.getByRole("alert").element();
    expect(root.classList.contains("m-alert--center")).toBe(true);
    expect(root.classList.contains("m-alert--with-title")).toBe(false);
    await expect.element(screen.getByText("只有一行说明")).toBeVisible();
  });
});
