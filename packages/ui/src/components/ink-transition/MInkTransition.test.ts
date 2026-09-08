import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { render } from "vitest-browser-vue";
import { MInkTransition } from ".";

// Vue Test Utils 默认把 <Transition> 桩掉，这里要真的跑过渡
const global = { stubs: { transition: false } };

describe("MInkTransition", () => {
  it("reveals on enter and wipes on leave", async () => {
    const show = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h(MInkTransition, { duration: 400, leaveDuration: 200, reducedMotion: false }, () =>
          show.value ? h("p", { id: "ink" }, "墨") : null,
        ),
    });
    const screen = await render(Host, { global });
    expect(screen.container.querySelector("#ink")).toBeNull();

    show.value = true;
    await nextTick();
    const el = screen.container.querySelector("#ink") as HTMLElement;
    expect(el).not.toBeNull();
    // enter 钩子在 patch 里同步启动动画；getAnimations 要等样式计算过一帧才看得到
    expect(el.getAttribute("data-ink-reveal")).toBe("self");
    expect(getComputedStyle(el).maskImage).toContain("data:image/svg+xml");
    await new Promise(requestAnimationFrame);
    expect(el.getAnimations().length).toBeGreaterThan(0);
    await vi.waitFor(() => expect(el.hasAttribute("data-ink-reveal")).toBe(false), {
      timeout: 3000,
    });

    show.value = false;
    await vi.waitFor(() => expect(screen.container.querySelector("#ink")).toBeNull(), {
      timeout: 3000,
    });
  });

  it("skips animation under reduced motion", async () => {
    const show = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(MInkTransition, { appear: true, reducedMotion: true }, () =>
          show.value ? h("p", { id: "ink" }, "墨") : null,
        ),
    });
    const screen = await render(Host, { global });
    const el = screen.container.querySelector("#ink") as HTMLElement;
    expect(el.hasAttribute("data-ink-reveal")).toBe(false);
    expect(el.getAnimations()).toHaveLength(0);
  });
});
