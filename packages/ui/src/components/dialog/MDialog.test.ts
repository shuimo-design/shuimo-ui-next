import { page, userEvent } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { ensureInkFilters, type InkFiltersHandle } from "../../ink/bleed";
import { MDialog } from ".";

let filters: InkFiltersHandle;
beforeEach(() => {
  filters = ensureInkFilters();
});
afterEach(() => filters.dispose());

/** 带触发按钮的宿主：真实场景里弹窗都是从页面上某个按钮打开的 */
const Host = defineComponent({
  props: {
    dialogProps: { type: Object, default: () => ({}) },
    onUpdate: { type: Function, required: false },
  },
  setup(props) {
    const open = ref(false);
    return () =>
      h("div", [
        h("button", { type: "button", onClick: () => (open.value = true) }, "打开"),
        h(
          MDialog,
          {
            modelValue: open.value,
            teleport: false,
            title: "山水",
            ...props.dialogProps,
            "onUpdate:modelValue": (value: boolean) => {
              open.value = value;
              props.onUpdate?.(value);
            },
          },
          {
            default: () => h("p", "君不见，黄河之水天上来"),
            footer: () => h("button", { type: "button" }, "确定"),
          },
        ),
      ]);
  },
});

describe("MDialog", () => {
  it("opens from a trigger, locks scroll, moves focus in and hands it back", async () => {
    const screen = await render(Host);
    const trigger = screen.getByRole("button", { name: "打开" });
    await trigger.click();
    const dialog = screen.getByRole("dialog");
    await expect.element(dialog).toBeVisible();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.documentElement.style.overflow).toBe("hidden");
    await vi.waitFor(() => expect(dialog.element().contains(document.activeElement)).toBe(true));

    const root = screen.container.querySelector<HTMLElement>(".m-dialog")!;
    // 挂牌一直在摆（rotate 动画），Playwright 等不到它"稳定"；人点得到，测试里跳过稳定性检查
    await screen.getByRole("button", { name: "关闭" }).click({ force: true });
    // 关掉后是 v-show 藏起来（面板留着，下次打开不用重画笔触），角色查询找不到隐藏元素，直接看 display
    await vi.waitFor(() => expect(getComputedStyle(root).display).toBe("none"));
    expect(document.documentElement.style.overflow).toBe("");
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element()));
  });

  it("closes on ESC and on mask click", async () => {
    const onUpdate = vi.fn();
    const screen = await render(Host, { props: { onUpdate } });
    await screen.getByRole("button", { name: "打开" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    const root = screen.container.querySelector<HTMLElement>(".m-dialog")!;
    // 没传 mask 也要有遮罩：类型里带 Boolean 的 prop 不写默认值会被 Vue 当成 false
    expect(root.classList.contains("m-dialog--masked")).toBe(true);
    await vi.waitFor(() => expect(getComputedStyle(root).display).toBe("none"));

    await screen.getByRole("button", { name: "打开" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    // 遮罩正中被面板盖着，点左上角才落在遮罩上
    const mask = screen.container.querySelector<HTMLElement>(".m-dialog__mask")!;
    await page.elementLocator(mask).click({ position: { x: 4, y: 4 } });
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenLastCalledWith(false);
  });

  it("ignores ESC and mask clicks when told to, and can hide the close button", async () => {
    const onUpdate = vi.fn();
    const screen = await render(Host, {
      props: {
        onUpdate,
        dialogProps: { closeOnEsc: false, mask: { clickClose: false }, closeBtn: false },
      },
    });
    await screen.getByRole("button", { name: "打开" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    expect(screen.container.querySelector(".m-dialog__close")).toBeNull();
    await userEvent.keyboard("{Escape}");
    const mask = screen.container.querySelector<HTMLElement>(".m-dialog__mask")!;
    await page.elementLocator(mask).click({ position: { x: 4, y: 4 } });
    expect(onUpdate).not.toHaveBeenCalledWith(false);
    await expect.element(screen.getByRole("dialog")).toBeVisible();
  });

  it("wraps Tab inside the panel and paints a brush frame once ink is ready", async () => {
    const screen = await render(Host);
    await screen.getByRole("button", { name: "打开" }).click();
    const panel = screen.container.querySelector<HTMLElement>(".m-dialog__panel")!;
    await vi.waitFor(() => expect(panel.hasAttribute("data-ink-stroke")).toBe(true));
    expect(getComputedStyle(panel).getPropertyValue("--m-ink-stroke-border")).toMatch(
      /^url\("data:image\/svg/,
    );

    // 面板里只有"关闭"和"确定"两个可聚焦元素：从最后一个再 Tab 会回到第一个
    const confirm = screen.getByRole("button", { name: "确定" });
    confirm.element().focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭" }).element());
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(confirm.element());
  });

  it("inlines the header scene with page-unique ids and the corner lattices as mask variables", async () => {
    const screen = await render(Host, { props: { dialogProps: { seed: 3 } } });
    await screen.getByRole("button", { name: "打开" }).click();
    const root = screen.container.querySelector<HTMLElement>(".m-dialog")!;
    for (const corner of ["tl", "tr", "br", "bl"])
      expect(root.style.getPropertyValue(`--m-modal-lattice-${corner}`)).toMatch(
        /^url\("data:image\/svg/,
      );
    expect(root.style.getPropertyValue("--m-modal-splash")).toMatch(/^url\("data:image\/svg/);
    const svg = root.querySelector(".m-dialog__scene svg")!;
    expect(svg).not.toBeNull();
    // 山体用纸色、墨用 currentColor：换主题时跟着变
    expect(svg.innerHTML).toContain("fill:var(--m-bg)");
    expect(svg.innerHTML).toContain('fill="currentColor"');
    expect(svg.innerHTML).not.toContain('fill="#000"');
    // 两个弹窗的滤镜 id 不能撞（两次 render 是两个应用，useId 会重复，靠 seed 区分）
    const second = await render(Host, { props: { dialogProps: { seed: 4 } } });
    // 两次 render 落在同一个容器里，后一个按钮被前一个弹窗的遮罩盖着，直接派发 DOM 点击
    second
      .getByRole("button", { name: "打开" })
      .last()
      .element()
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() =>
      expect(document.querySelectorAll(".m-dialog__scene svg").length).toBe(2),
    );
    const ids = [...document.querySelectorAll(".m-dialog__scene filter")].map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
