import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import { MPopconfirm, type PopconfirmProps } from ".";

function mount(props: Partial<PopconfirmProps> & Record<string, unknown> = {}) {
  return render(MPopconfirm, {
    props: { teleport: false, title: "确定删除这一项？", ...props },
    slots: { default: () => h("button", { type: "button" }, "删除") },
  });
}

/** 气泡旁边放一个无关按钮，用来点「外面」 */
const OutsideHost = defineComponent({
  props: { onCancel: { type: Function, required: false } },
  setup(props) {
    return () =>
      h("div", [
        h(
          MPopconfirm,
          {
            teleport: false,
            title: "确定删除这一项？",
            onCancel: () => props.onCancel?.(),
          },
          { default: () => h("button", { type: "button" }, "删除") },
        ),
        h("button", { type: "button" }, "外面"),
      ]);
  },
});

describe("MPopconfirm", () => {
  it("opens on click, confirms and closes", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onUpdate = vi.fn();
    const screen = await mount({
      content: "删除后不可恢复",
      onConfirm,
      onCancel,
      "onUpdate:open": onUpdate,
    });
    expect(screen.container.querySelector(".m-popconfirm__float")).toBeNull();

    const trigger = screen.getByRole("button", { name: "删除" });
    await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await trigger.click();
    const dialog = screen.getByRole("dialog", { name: "确定删除这一项？" });
    await expect.element(dialog).toBeVisible();
    await expect.element(screen.getByText("删除后不可恢复")).toBeVisible();
    expect(onUpdate).toHaveBeenCalledWith(true);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    // 徽记和墨尖都在
    expect(screen.container.querySelector(".m-popconfirm__icon")).not.toBeNull();
    expect(screen.container.querySelector(".m-popconfirm__arrow")).not.toBeNull();
    // 打开后焦点落在取消按钮上
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "取消" }).element()),
    );

    await screen.getByRole("button", { name: "确定" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    await expect.element(dialog).not.toBeInTheDocument();
    // 焦点还给触发元素
    expect(document.activeElement).toBe(trigger.element());
  });

  it("cancels with the cancel button", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const screen = await mount({ onConfirm, onCancel, cancelText: "算了" });
    await screen.getByRole("button", { name: "删除" }).click();
    await screen.getByRole("button", { name: "算了" }).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("counts an outside click as cancel", async () => {
    const onCancel = vi.fn();
    const screen = await render(OutsideHost, { props: { onCancel } });
    await screen.getByRole("button", { name: "删除" }).click();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await screen.getByRole("button", { name: "外面" }).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Escape as cancel and restores focus", async () => {
    const onCancel = vi.fn();
    const screen = await mount({ onCancel });
    const trigger = screen.getByRole("button", { name: "删除" });
    await trigger.click();
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "取消" }).element()),
    );
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger.element());
  });

  it("does nothing when disabled", async () => {
    const onUpdate = vi.fn();
    const screen = await mount({ disabled: true, "onUpdate:open": onUpdate });
    await screen.getByRole("button", { name: "删除" }).click();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.container.querySelector(".m-popconfirm__float")).toBeNull();
  });

  it("renders title / content slots, hides the icon and follows v-model:open", async () => {
    const Host = defineComponent({
      setup() {
        const open = ref(false);
        return () =>
          h("div", [
            h(
              MPopconfirm,
              {
                teleport: false,
                title: "标题",
                icon: false,
                open: open.value,
                "onUpdate:open": (v: boolean) => (open.value = v),
              },
              {
                default: () => h("button", { type: "button" }, "删除"),
                title: () => h("em", "自定义标题"),
                content: () => h("i", "自定义说明"),
              },
            ),
            h("button", { type: "button", onClick: () => (open.value = !open.value) }, "切换"),
          ]);
      },
    });
    const screen = await render(Host);
    // 用键盘按「切换」：鼠标点它同时也算点到气泡外面，两边会互相抵消
    (screen.getByRole("button", { name: "切换" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByText("自定义标题")).toBeVisible();
    await expect.element(screen.getByText("自定义说明")).toBeVisible();
    expect(screen.container.querySelector(".m-popconfirm__icon")).toBeNull();
    // 焦点被送进了气泡，回到切换按钮再按一次
    (screen.getByRole("button", { name: "切换" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });
});
