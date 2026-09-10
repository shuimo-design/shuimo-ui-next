import { page, userEvent } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { ensureInkFilters, type InkFiltersHandle } from "../../ink/bleed";
import { MDrawer, type DrawerDirection } from ".";

let filters: InkFiltersHandle;
beforeEach(() => {
  filters = ensureInkFilters();
});
afterEach(() => filters.dispose());

const Host = defineComponent({
  props: {
    drawerProps: { type: Object, default: () => ({}) },
    onUpdate: { type: Function, required: false },
  },
  setup(props) {
    const open = ref(false);
    return () =>
      h("div", [
        h("button", { type: "button", onClick: () => (open.value = true) }, "打开"),
        h(
          MDrawer,
          {
            modelValue: open.value,
            teleport: false,
            title: "抽屉",
            ...props.drawerProps,
            "onUpdate:modelValue": (value: boolean) => {
              open.value = value;
              props.onUpdate?.(value);
            },
          },
          { default: () => h("p", "君不见，黄河之水天上来") },
        ),
      ]);
  },
});

describe("MDrawer", () => {
  it("slides in from the right by default, locks scroll and restores focus on close", async () => {
    const screen = await render(Host);
    const trigger = screen.getByRole("button", { name: "打开" });
    await trigger.click();
    const drawer = screen.getByRole("dialog");
    await expect.element(drawer).toBeVisible();
    const root = screen.container.querySelector<HTMLElement>(".m-drawer")!;
    expect(root.classList.contains("m-drawer--right")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");
    await vi.waitFor(() => expect(drawer.element().contains(document.activeElement)).toBe(true));

    // 挂牌一直在摆（rotate 动画），Playwright 等不到它"稳定"；人点得到，测试里跳过稳定性检查
    await screen.getByRole("button", { name: "关闭" }).click({ force: true });
    // 关掉后是 v-show 藏起来（面板留着，边缘那一笔不用重画），角色查询找不到隐藏元素，直接看 display
    await vi.waitFor(() => expect(getComputedStyle(root).display).toBe("none"));
    expect(document.documentElement.style.overflow).toBe("");
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element()));
  });

  it("closes on ESC and on mask click, unless disabled", async () => {
    const onUpdate = vi.fn();
    const screen = await render(Host, { props: { onUpdate } });
    await screen.getByRole("button", { name: "打开" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(onUpdate).toHaveBeenLastCalledWith(false);

    await screen.getByRole("button", { name: "打开" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    // 右侧抽屉盖住遮罩右边，点左上角才落在遮罩上
    await page
      .elementLocator(screen.container.querySelector<HTMLElement>(".m-drawer__mask")!)
      .click({ position: { x: 4, y: 4 } });
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenLastCalledWith(false);

    // 同一页里再挂一个宿主会让"打开"按钮撞名，先卸掉上一个
    screen.unmount();
    const locked = await render(Host, {
      props: { drawerProps: { closeOnEsc: false, mask: { show: false, clickClose: false } } },
    });
    await locked.getByRole("button", { name: "打开" }).click();
    await expect.element(locked.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await page
      .elementLocator(locked.container.querySelector<HTMLElement>(".m-drawer__mask")!)
      .click({ position: { x: 4, y: 4 } });
    await expect.element(locked.getByRole("dialog")).toBeVisible();
    expect(
      locked.container.querySelector(".m-drawer")!.classList.contains("m-drawer--masked"),
    ).toBe(false);
  });

  it("sizes the panel per direction and draws the shared paper frame", async () => {
    const directions: DrawerDirection[] = ["left", "top", "bottom"];
    for (const direction of directions) {
      const screen = await render(Host, { props: { drawerProps: { direction, size: 200 } } });
      await screen.getByRole("button", { name: "打开" }).click();
      const panel = screen.getByRole("dialog");
      await expect.element(panel).toBeVisible();
      const rect = panel.element().getBoundingClientRect();
      if (direction === "left") expect(Math.round(rect.width)).toBe(200);
      else expect(Math.round(rect.height)).toBe(200);
      const root = screen.container.querySelector<HTMLElement>(".m-drawer")!;
      // 四角回纹和牌顶墨花的遮罩都是运行时生成的 data URL，和弹窗同一套变量
      for (const corner of ["tl", "tr", "br", "bl"] as const)
        expect(root.style.getPropertyValue(`--m-modal-lattice-${corner}`)).toMatch(
          /^url\("data:image\/svg/,
        );
      expect(root.style.getPropertyValue("--m-modal-splash")).toMatch(/^url\("data:image\/svg/);
      // 纸框是 useBrushBorder 生成的，挂在面板上
      await vi.waitFor(() =>
        expect(getComputedStyle(panel.element()).getPropertyValue("--m-ink-stroke-border")).toMatch(
          /^url\("data:image\/svg/,
        ),
      );
      await userEvent.keyboard("{Escape}");
      await vi.waitFor(() => expect(getComputedStyle(root).display).toBe("none"));
      screen.unmount();
    }
  });
});
