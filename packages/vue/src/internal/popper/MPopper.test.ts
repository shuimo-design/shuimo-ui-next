import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h, ref } from "vue";
import MPopper from "./MPopper.vue";

const Host = defineComponent({
  props: { onClickOutside: { type: Function, required: false } },
  setup(props) {
    const open = ref(true);
    const anchor = ref<HTMLElement | null>(null);
    return () =>
      h("div", { style: "padding: 40px" }, [
        h("button", { ref: anchor, type: "button" }, "anchor"),
        h("button", { type: "button" }, "elsewhere"),
        h(
          MPopper,
          {
            open: open.value,
            reference: anchor.value,
            teleport: false,
            role: "listbox",
            onClickOutside: (event: PointerEvent) => props.onClickOutside?.(event),
          },
          { default: () => h("div", "popper content") },
        ),
      ]);
  },
});

describe("MPopper", () => {
  it("positions below the reference and reports outside clicks", async () => {
    const onClickOutside = vi.fn();
    const screen = await render(Host, { props: { onClickOutside } });
    const popper = screen.getByRole("listbox");
    await expect.element(popper).toBeVisible();

    const anchorRect = screen
      .getByRole("button", { name: "anchor" })
      .element()
      .getBoundingClientRect();
    // floating-ui 的定位是异步算出来的
    await vi.waitFor(() => {
      const popperRect = popper.element().getBoundingClientRect();
      expect(popperRect.top).toBeGreaterThanOrEqual(anchorRect.bottom);
      expect(Math.abs(popperRect.left - anchorRect.left)).toBeLessThan(1);
    });

    await screen.getByRole("button", { name: "elsewhere" }).click();
    expect(onClickOutside).toHaveBeenCalledTimes(1);

    // 点参照元素本身不算外部
    await screen.getByRole("button", { name: "anchor" }).click();
    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });
});
