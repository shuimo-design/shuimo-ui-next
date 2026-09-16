import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MOverlayOutlet } from "../overlay-outlet";
import { MNotification } from ".";

/** 函数式弹出的通知被出口传送到 body，不归 render 的自动清理管，测完自己关掉 */
async function settled() {
  MNotification.closeAll();
  await vi.waitFor(() => {
    expect(document.querySelectorAll(".m-notification-list .m-notification")).toHaveLength(0);
  });
}

describe("MNotification", () => {
  afterEach(settled);

  it("renders title, content, type class and a badge icon", async () => {
    const screen = await render(
      <MNotification type="success" title="保存成功" content="已同步到云端" duration={0} />,
    );
    const item = screen.getByRole("status");
    await expect.element(item).toHaveTextContent("保存成功");
    await expect.element(item).toHaveTextContent("已同步到云端");
    await expect.element(item).toHaveClass("m-notification--success");
    expect(screen.container.querySelector(".m-notification__icon")).not.toBeNull();
    expect(item.element().getAttribute("style")).toContain("--m-notification-badge");
  });

  it("uses role=alert for errors and skips the badge without a type", async () => {
    const screen = await render(<MNotification type="error" title="出错了" duration={0} />);
    await expect.element(screen.getByRole("alert")).toHaveTextContent("出错了");
    const plain = await render(<MNotification title="无类型" duration={0} />);
    expect(plain.container.querySelector(".m-notification__icon")).toBeNull();
  });

  it("opens a notification imperatively and closes it through the handle", async () => {
    await render(<MOverlayOutlet />);
    const onClose = vi.fn();
    const handle = MNotification.success({ title: "成功了", onClose });
    await vi.waitFor(() => {
      expect(document.querySelector(".m-notification--success")?.textContent).toContain("成功了");
    });
    expect(
      document
        .querySelector(".m-notification-list--top-right")
        ?.contains(document.querySelector(".m-notification")),
    ).toBe(true);
    handle.close();
    await handle.closed;
    expect(document.querySelector(".m-notification")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("auto closes after the duration and honours the placement", async () => {
    await render(<MOverlayOutlet />);
    const onClose = vi.fn();
    const handle = MNotification.open({
      title: "很快消失",
      duration: 50,
      placement: "bottom-left",
    });
    void handle.closed.then(onClose);
    await vi.waitFor(() => {
      expect(
        document.querySelector(".m-notification-list--bottom-left .m-notification"),
      ).not.toBeNull();
    });
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(document.querySelector(".m-notification-list--bottom-left .m-notification")).toBeNull();
  });

  it("accepts a plain string as the title", async () => {
    await render(<MOverlayOutlet />);
    MNotification.info("只有标题");
    await vi.waitFor(() => {
      expect(document.querySelector(".m-notification__title")?.textContent).toBe("只有标题");
    });
    expect(document.querySelector(".m-notification__content")).toBeNull();
  });

  it("emits close after clicking the close button and hides it when not closable", async () => {
    const onClose = vi.fn();
    const screen = await render(<MNotification title="手动关" duration={0} onClose={onClose} />);
    await screen.getByRole("button", { name: "关闭" }).click();
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    const sticky = await render(<MNotification title="不可关" duration={0} closable={false} />);
    expect(sticky.container.querySelector(".m-notification__close")).toBeNull();
  });

  it("closes from the keyboard through the close button", async () => {
    const onClose = vi.fn();
    const screen = await render(<MNotification title="键盘关" duration={0} onClose={onClose} />);
    (screen.getByRole("button", { name: "关闭" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("pauses the countdown while hovered", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <MNotification title="悬停暂停" duration={800} onClose={onClose} />,
    );
    const item = screen.getByRole("status");
    await userEvent.hover(item);
    // 进场动画要 300ms，hover 会等元素稳定再落下去；等够一个完整的倒计时再看它还在不在
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.unhover(item);
    await vi.waitFor(
      () => {
        expect(onClose).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });
});
