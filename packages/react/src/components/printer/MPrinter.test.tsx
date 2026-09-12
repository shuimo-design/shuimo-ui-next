import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { createPrinter, MPrinter } from ".";

function query(container: HTMLElement, selector: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el;
}

describe("MPrinter", () => {
  it("types the text one character at a time and emits end", async () => {
    const onEnd = vi.fn();
    const screen = await render(<MPrinter text="水墨" speed={150} onEnd={onEnd} />);
    const textEl = query(screen.container, ".m-printer__text");
    expect(textEl.textContent).toBe("");
    await expect.poll(() => textEl.textContent).toBe("水");
    await expect.poll(() => textEl.textContent).toBe("水墨");
    await expect.poll(() => onEnd.mock.calls.length).toBe(1);
    await expect.element(query(screen.container, ".m-printer")).toHaveClass("m-printer--done");
    await expect
      .element(query(screen.container, ".m-printer"))
      .toHaveAttribute("aria-label", "水墨");
    expect(screen.container.querySelector(".m-printer__cursor")).not.toBeNull();
  });

  it("shows everything at once when speed is 0 and hides the cursor on demand", async () => {
    const onEnd = vi.fn();
    const screen = await render(
      <MPrinter text="一笔写完" speed={0} cursor={false} onEnd={onEnd} />,
    );
    await expect
      .poll(() => screen.container.querySelector(".m-printer__text")?.textContent)
      .toBe("一笔写完");
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(screen.container.querySelector(".m-printer__cursor")).toBeNull();
  });

  it("loops and restarts when the text changes", async () => {
    const onEnd = vi.fn();
    const screen = await render(<MPrinter text="ab" speed={20} loop pause={40} onEnd={onEnd} />);
    await expect.poll(() => onEnd.mock.calls.length).toBeGreaterThanOrEqual(2);
    await screen.rerender(<MPrinter text="cd" speed={20} loop pause={40} onEnd={onEnd} />);
    const textEl = query(screen.container, ".m-printer__text");
    await expect.poll(() => textEl.textContent).toBe("cd");
  });

  it("waits for restart() when autoplay is off", async () => {
    const screen = await render(<MPrinter text="等" speed={10} autoplay={false} />);
    const textEl = query(screen.container, ".m-printer__text");
    await new Promise((r) => setTimeout(r, 60));
    expect(textEl.textContent).toBe("");
  });

  it("exposes restart and finish through the ref", async () => {
    const handle = { current: null } as React.RefObject<{
      restart(): void;
      finish(): void;
    } | null>;
    const screen = await render(<MPrinter ref={handle} text="听雨" speed={10} autoplay={false} />);
    const textEl = query(screen.container, ".m-printer__text");
    expect(textEl.textContent).toBe("");
    handle.current!.finish();
    await expect.poll(() => textEl.textContent).toBe("听雨");
    handle.current!.restart();
    await expect.poll(() => textEl.textContent).toBe("听雨");
  });

  it("createPrinter prints a badge to the console", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const printer = createPrinter("测试");
    printer.suggest("建议");
    printer.info("信息");
    printer.error("异常");
    expect(log).toHaveBeenCalledTimes(2);
    expect(log.mock.calls[0]?.[0]).toBe("%c 测试 ");
    expect(log.mock.calls[0]?.[2]).toBe("建议");
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[2]).toBe("异常");
    log.mockRestore();
    error.mockRestore();
  });
});
