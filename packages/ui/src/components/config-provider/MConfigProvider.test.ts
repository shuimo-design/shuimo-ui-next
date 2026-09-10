import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h } from "vue";
import { MConfigProvider, useConfig } from ".";

/** 把读到的配置打印出来，方便断言 */
const Probe = defineComponent({
  name: "Probe",
  setup() {
    const config = useConfig();
    return () =>
      h(
        "output",
        { "data-testid": "probe" },
        `${config.value.size}/${config.value.locale}/${config.value.inkTier ?? "auto"}/${config.value.theme ?? "none"}`,
      );
  },
});

describe("MConfigProvider", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it("falls back to defaults without a provider", async () => {
    const screen = await render(Probe);
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("md/zh-CN/auto/none");
  });

  it("provides config to descendants and reacts to prop changes", async () => {
    const screen = await render(MConfigProvider, {
      props: { size: "lg", locale: "en-US", inkTier: 2 },
      slots: { default: () => h(Probe) },
    });
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("lg/en-US/2/none");
    await screen.rerender({ size: "sm" });
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("sm/en-US/2/none");
  });

  it("merges nested providers: inner overrides only what it sets", async () => {
    const screen = await render(MConfigProvider, {
      props: { size: "lg", locale: "en-US" },
      slots: { default: () => h(MConfigProvider, { size: "sm" }, () => h(Probe)) },
    });
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("sm/en-US/auto/none");
  });

  it("writes theme to html[data-theme] after mount", async () => {
    const screen = await render(MConfigProvider, {
      props: { theme: "dark" },
      slots: { default: () => h(Probe) },
    });
    await expect.element(screen.getByTestId("probe")).toHaveTextContent("md/zh-CN/auto/dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    await screen.rerender({ theme: "system" });
    await expect.poll(() => document.documentElement.dataset.theme).toBe("system");
  });
});
