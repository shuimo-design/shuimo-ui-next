import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref, withDirectives } from "vue";
import { MLoading, vLoading } from ".";

describe("MLoading", () => {
  it("renders the ink-dot spinner with speed and size as CSS variables", async () => {
    const screen = await render(MLoading, { props: { speed: 800, size: 64 } });
    const root = screen.getByRole("status");
    await expect.element(root).toHaveAttribute("aria-label", "加载中");
    const el = root.element() as HTMLElement;
    expect(el.style.getPropertyValue("--m-loading-speed")).toBe("800ms");
    expect(el.style.getPropertyValue("--m-loading-size")).toBe("64px");
    expect(el.querySelectorAll(".m-loading__spinner polygon").length).toBe(8);
    expect(el.classList.contains("m-loading--mask")).toBe(false);
  });

  it("shows text and the mask modifier", async () => {
    const screen = await render(MLoading, { props: { mask: true, text: "正在加载" } });
    await expect.element(screen.getByText("正在加载")).toBeVisible();
    expect(screen.getByRole("status").element().classList.contains("m-loading--mask")).toBe(true);
  });

  it("replaces the spinner with the indicator slot", async () => {
    const screen = await render(MLoading, {
      slots: { indicator: () => h("i", { class: "custom-indicator" }) },
    });
    expect(screen.container.querySelector(".custom-indicator")).not.toBeNull();
    expect(screen.container.querySelector(".m-loading__spinner")).toBeNull();
  });

  it("v-loading mounts and removes a mask on the host", async () => {
    const loading = ref(true);
    const Host = defineComponent({
      setup() {
        return () =>
          withDirectives(h("div", { class: "host", style: "width:120px;height:80px" }, "内容"), [
            [vLoading, loading.value],
          ]);
      },
    });
    const screen = await render(Host);
    const host = screen.container.querySelector<HTMLElement>(".host")!;
    expect(host.querySelector(".m-loading--mask")).not.toBeNull();
    expect(host.classList.contains("m-loading-parent")).toBe(true);
    // 宿主原有内容要保留
    expect(host.textContent).toContain("内容");

    loading.value = false;
    await expect.poll(() => host.querySelector(".m-loading")).toBeNull();
    expect(host.classList.contains("m-loading-parent")).toBe(false);

    loading.value = true;
    await expect.poll(() => host.querySelector(".m-loading--mask")).not.toBeNull();
  });
});
