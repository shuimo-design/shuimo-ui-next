import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MPopover, type PopoverProps } from ".";

function mount(props: PopoverProps & Record<string, unknown> = {}) {
  return render(MPopover, {
    props: { teleport: false, content: "君不见，黄河之水天上来", ...props },
    slots: { default: () => h("button", { type: "button" }, "触发") },
  });
}

/** 气泡旁边放一个无关按钮，用来点「外面」 */
const OutsideHost = defineComponent({
  props: { disableClickAway: Boolean },
  setup(props) {
    return () =>
      h("div", [
        h(
          MPopover,
          { teleport: false, content: "内容", disableClickAway: props.disableClickAway },
          { default: () => h("button", { type: "button" }, "触发") },
        ),
        h("button", { type: "button" }, "外面"),
      ]);
  },
});

describe("MPopover", () => {
  it("toggles on click and reports visibility", async () => {
    const onUpdate = vi.fn();
    const onVisibleChange = vi.fn();
    const screen = await mount({ "onUpdate:show": onUpdate, onVisibleChange });
    expect(screen.container.querySelector(".m-popover__float")).toBeNull();

    const trigger = screen.getByRole("button", { name: "触发" });
    await trigger.click();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    expect(onUpdate).toHaveBeenCalledWith(true);
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    // 参照元素就是插槽里的按钮，展开状态标在它身上
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");

    await trigger.click();
    expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    await expect.element(screen.getByText("君不见，黄河之水天上来")).not.toBeInTheDocument();
  });

  it("closes on outside click", async () => {
    const screen = await render(OutsideHost);
    await screen.getByRole("button", { name: "触发" }).click();
    await expect.element(screen.getByText("内容")).toBeVisible();
    await screen.getByRole("button", { name: "外面" }).click();
    await expect.element(screen.getByText("内容")).not.toBeInTheDocument();
  });

  it("stays open on outside click with disableClickAway", async () => {
    const screen = await render(OutsideHost, { props: { disableClickAway: true } });
    await screen.getByRole("button", { name: "触发" }).click();
    await screen.getByRole("button", { name: "外面" }).click();
    await expect.element(screen.getByText("内容")).toBeVisible();
  });

  it("opens on hover and closes after leaving", async () => {
    const screen = await mount({ trigger: "hover", closeDelay: 0 });
    const trigger = screen.getByRole("button", { name: "触发" });
    await trigger.hover();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    await trigger.unhover();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).not.toBeInTheDocument();
  });

  it("closes with Escape", async () => {
    const screen = await mount();
    await screen.getByRole("button", { name: "触发" }).click();
    await expect.element(screen.getByText("君不见，黄河之水天上来")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByText("君不见，黄河之水天上来")).not.toBeInTheDocument();
  });

  it("follows v-model:show in manual mode", async () => {
    const Host = defineComponent({
      setup() {
        const show = ref(false);
        return () =>
          h("div", [
            h(
              MPopover,
              {
                teleport: false,
                trigger: "manual",
                content: "手动",
                show: show.value,
                "onUpdate:show": (v: boolean) => (show.value = v),
              },
              { default: () => h("button", { type: "button" }, "触发") },
            ),
            h("button", { type: "button", onClick: () => (show.value = !show.value) }, "切换"),
          ]);
      },
    });
    const screen = await render(Host);
    // manual 下点参照元素不开
    await screen.getByRole("button", { name: "触发" }).click();
    expect(screen.container.querySelector(".m-popover__float")).toBeNull();
    await screen.getByRole("button", { name: "切换" }).click();
    await expect.element(screen.getByText("手动")).toBeVisible();
    await screen.getByRole("button", { name: "切换" }).click();
    await expect.element(screen.getByText("手动")).not.toBeInTheDocument();
  });

  it("renders the arrow and the content slot", async () => {
    const screen = await render(MPopover, {
      props: { teleport: false },
      slots: {
        default: () => h("button", { type: "button" }, "触发"),
        content: () => h("em", "自定义内容"),
      },
    });
    await screen.getByRole("button", { name: "触发" }).click();
    await expect.element(screen.getByText("自定义内容")).toBeVisible();
    expect(screen.container.querySelector(".m-popover__arrow")).not.toBeNull();
  });

  it("does nothing when disabled", async () => {
    const onVisibleChange = vi.fn();
    const screen = await mount({ disabled: true, onVisibleChange });
    await screen.getByRole("button", { name: "触发" }).click();
    expect(onVisibleChange).not.toHaveBeenCalled();
    expect(screen.container.querySelector(".m-popover__float")).toBeNull();
  });
});
