import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MOverlayOutlet } from "../overlay-outlet";
import { MMessage } from ".";

function pointer(el: Element, type: string, x: number, y: number) {
  el.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      button: 0,
      clientX: x,
      clientY: y,
      bubbles: true,
    }),
  );
}

/** 函数式弹出的消息被出口传送到 body，不归 render 的自动清理管，测完自己关掉 */
async function settled() {
  MMessage.closeAll();
  await vi.waitFor(() => {
    expect(document.querySelectorAll(".m-message-list .m-message")).toHaveLength(0);
  });
}

describe("MMessage", () => {
  afterEach(settled);

  it("renders content, type class and a badge icon", async () => {
    const screen = await render(<MMessage type="success" content="保存成功" duration={0} />);
    const item = screen.getByRole("status");
    await expect.element(item).toHaveTextContent("保存成功");
    await expect.element(item).toHaveClass("m-message--success");
    const icon = screen.container.querySelector<HTMLElement>(".m-message__icon")!;
    expect(icon.style.getPropertyValue("--m-message-badge")).toBe("");
    expect(item.element().getAttribute("style")).toContain("--m-message-badge");
  });

  it("shows a message imperatively and closes it through the handle", async () => {
    await render(<MOverlayOutlet />);
    const handle = MMessage.success("成功了");
    await vi.waitFor(() => {
      expect(document.querySelector(".m-message--success")?.textContent).toContain("成功了");
    });
    expect(
      document
        .querySelector(".m-message-list--top-right")
        ?.contains(document.querySelector(".m-message")),
    ).toBe(true);
    handle.close();
    await handle.closed;
    expect(document.querySelector(".m-message")).toBeNull();
  });

  it("auto closes after the duration and honours the direction", async () => {
    await render(<MOverlayOutlet />);
    const onClose = vi.fn();
    const handle = MMessage.show({
      content: "很快消失",
      duration: 50,
      direction: "top-center",
    });
    void handle.closed.then(onClose);
    await vi.waitFor(() => {
      expect(document.querySelector(".m-message-list--top-center .m-message")).not.toBeNull();
    });
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(document.querySelector(".m-message-list--top-center .m-message")).toBeNull();
  });

  it("renders the close button and emits close after clicking it", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <MMessage content="手动关" duration={0} closable onClose={onClose} />,
    );
    await screen.getByRole("button", { name: "关闭" }).click();
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("dismisses when dragged past a third of its width", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <MMessage content="拖我" duration={0} direction="top-right" onClose={onClose} />,
    );
    const el = screen.getByRole("status").element() as HTMLElement;
    const width = el.offsetWidth;
    pointer(el, "pointerdown", 10, 10);
    pointer(el, "pointermove", 10 + width / 2, 10);
    await expect.element(screen.getByRole("status")).toHaveClass("m-message--removing");
    pointer(el, "pointerup", 10 + width / 2, 10);
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("springs back when released before the threshold", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <MMessage content="拖一点" duration={0} direction="top-right" onClose={onClose} />,
    );
    const el = screen.getByRole("status").element() as HTMLElement;
    pointer(el, "pointerdown", 10, 10);
    pointer(el, "pointermove", 30, 10);
    await vi.waitFor(() => {
      expect(el.style.transform).toBe("translate(20px, 0px)");
    });
    pointer(el, "pointerup", 30, 10);
    await vi.waitFor(() => {
      expect(el.style.transform).toBe("");
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores dragging when dragAllow is false", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <MMessage content="别拖" duration={0} dragAllow={false} onClose={onClose} />,
    );
    const el = screen.getByRole("status").element() as HTMLElement;
    pointer(el, "pointerdown", 10, 10);
    pointer(el, "pointermove", 10 + el.offsetWidth, 10);
    pointer(el, "pointerup", 10 + el.offsetWidth, 10);
    expect(el.style.transform).toBe("");
    expect(el.classList.contains("m-message--removing")).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(onClose).not.toHaveBeenCalled();
  });
});
