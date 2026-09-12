import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MConfigProvider, useConfig } from ".";

/** 把读到的配置打印出来，方便断言 */
function Probe() {
  const config = useConfig();
  return (
    <output data-testid="probe">
      {`${config.size}/${config.locale}/${config.inkTier ?? "auto"}/${config.theme ?? "none"}`}
    </output>
  );
}

describe("MConfigProvider", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it("falls back to defaults without a provider", async () => {
    const screen = await render(<Probe />);
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("md/zh-CN/auto/none");
  });

  it("provides config to descendants and reacts to prop changes", async () => {
    const screen = await render(
      <MConfigProvider size="lg" locale="en-US" inkTier={2}>
        <Probe />
      </MConfigProvider>,
    );
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("lg/en-US/2/none");
    await screen.rerender(
      <MConfigProvider size="sm" locale="en-US" inkTier={2}>
        <Probe />
      </MConfigProvider>,
    );
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("sm/en-US/2/none");
  });

  it("merges nested providers: inner overrides only what it sets", async () => {
    const screen = await render(
      <MConfigProvider size="lg" locale="en-US">
        <MConfigProvider size="sm">
          <Probe />
        </MConfigProvider>
      </MConfigProvider>,
    );
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("sm/en-US/auto/none");
  });

  it("writes theme to html[data-theme] after mount", async () => {
    const screen = await render(
      <MConfigProvider theme="dark">
        <Probe />
      </MConfigProvider>,
    );
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("md/zh-CN/auto/dark");
    await expect.poll(() => document.documentElement.dataset.theme).toBe("dark");
    await screen.rerender(
      <MConfigProvider theme="system">
        <Probe />
      </MConfigProvider>,
    );
    await expect.poll(() => document.documentElement.dataset.theme).toBe("system");
  });
});
