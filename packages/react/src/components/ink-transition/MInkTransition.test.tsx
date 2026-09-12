import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MInkTransition } from ".";

// 断言和 Vue 那份逐字一致；Vue 写在插槽里的 v-if 在这边是 in 属性
describe("MInkTransition", () => {
  it("reveals on enter and wipes on leave", async () => {
    const screen = await render(
      <MInkTransition in={false} duration={400} leaveDuration={200} reducedMotion={false}>
        <p id="ink">墨</p>
      </MInkTransition>,
    );
    expect(screen.container.querySelector("#ink")).toBeNull();

    await screen.rerender(
      <MInkTransition in duration={400} leaveDuration={200} reducedMotion={false}>
        <p id="ink">墨</p>
      </MInkTransition>,
    );
    // 节点先挂上、下一轮才播入场，所以等属性出现而不是立刻断言
    await expect
      .poll(() => screen.container.querySelector("#ink")?.getAttribute("data-ink-reveal"))
      .toBe("self");
    const el = screen.container.querySelector("#ink") as HTMLElement;
    expect(getComputedStyle(el).maskImage).toContain("data:image/svg+xml");
    await new Promise(requestAnimationFrame);
    expect(el.getAnimations().length).toBeGreaterThan(0);
    await vi.waitFor(() => expect(el.hasAttribute("data-ink-reveal")).toBe(false), {
      timeout: 3000,
    });

    await screen.rerender(
      <MInkTransition in={false} duration={400} leaveDuration={200} reducedMotion={false}>
        <p id="ink">墨</p>
      </MInkTransition>,
    );
    await vi.waitFor(() => expect(screen.container.querySelector("#ink")).toBeNull(), {
      timeout: 3000,
    });
  });

  it("skips animation under reduced motion", async () => {
    const screen = await render(
      <MInkTransition in appear reducedMotion>
        <p id="ink">墨</p>
      </MInkTransition>,
    );
    const el = screen.container.querySelector("#ink") as HTMLElement;
    expect(el.hasAttribute("data-ink-reveal")).toBe(false);
    expect(el.getAnimations()).toHaveLength(0);
  });
});
