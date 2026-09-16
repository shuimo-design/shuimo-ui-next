import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { MPaperTheme, PAPER_THEME_STORAGE_KEY } from ".";

const html = document.documentElement;

function resetRoot() {
  localStorage.clear();
  delete html.dataset.paper;
  delete html.dataset.theme;
  html.removeAttribute("style");
}

describe("MPaperTheme", () => {
  beforeEach(resetRoot);

  it("renders a radiogroup with one radio per preset and nothing checked by default", async () => {
    const screen = await render(MPaperTheme);
    await expect.element(screen.getByRole("radiogroup")).toBeInTheDocument();
    const radios = screen.getByRole("radio").elements();
    expect(radios.map((r) => r.textContent)).toEqual(["生宣", "熟宣", "古色", "茶染", "月白"]);
    expect(radios.every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
    // 没记录也没切过：不动 html
    expect(html.dataset.paper).toBeUndefined();
    expect(html.style.getPropertyValue("--m-paper-rgb")).toBe("");
    // 没选中时第一个进 Tab 序
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it("applies the preset to html, remembers it and emits", async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const screen = await render(MPaperTheme, {
      props: { "onUpdate:preset": onUpdate, onChange },
    });
    const antique = screen.getByRole("radio", { name: "古色" });
    await antique.click();
    await expect.element(antique).toHaveAttribute("aria-checked", "true");
    expect(html.dataset.paper).toBe("antique");
    expect(html.style.getPropertyValue("--m-paper-rgb")).toBe("245 235 215");
    expect(html.style.getPropertyValue("--m-bg")).toBe("rgb(245 235 215)");
    expect(html.style.getPropertyValue("--m-paper-theme-texture")).toMatch(/^url\("data:/);
    expect(localStorage.getItem(PAPER_THEME_STORAGE_KEY)).toBe("antique");
    expect(onUpdate).toHaveBeenLastCalledWith("antique");
    expect(onChange).toHaveBeenCalledWith("antique");
    // 再点同一个不再触发 change
    await antique.click();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("is disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(MPaperTheme, { props: { disabled: true, onChange } });
    const raw = screen.getByRole("radio", { name: "生宣" });
    await expect.element(raw).toBeDisabled();
    await raw.click({ force: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(html.dataset.paper).toBeUndefined();
  });

  it("moves and selects with the arrow keys, Home and End", async () => {
    const onChange = vi.fn();
    const screen = await render(MPaperTheme, { props: { onChange } });
    const raw = screen.getByRole("radio", { name: "生宣" });
    (raw.element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    const processed = screen.getByRole("radio", { name: "熟宣" });
    await expect.element(processed).toHaveAttribute("aria-checked", "true");
    await expect.element(processed).toHaveFocus();
    expect(html.dataset.paper).toBe("processed");
    expect(onChange).toHaveBeenLastCalledWith("processed");
    // 到头循环
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .element(screen.getByRole("radio", { name: "月白" }))
      .toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{Home}");
    await expect.element(raw).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{End}");
    await expect.element(screen.getByRole("radio", { name: "月白" })).toHaveFocus();
    // 选中的那个进 Tab 序，其余不进
    expect(
      screen
        .getByRole("radio")
        .elements()
        .map((r) => r.tabIndex),
    ).toEqual([-1, -1, -1, -1, 0]);
  });

  it("restores the stored preset on mount", async () => {
    localStorage.setItem(PAPER_THEME_STORAGE_KEY, "moonWhite");
    const screen = await render(MPaperTheme);
    await expect
      .element(screen.getByRole("radio", { name: "月白" }))
      .toHaveAttribute("aria-checked", "true");
    expect(html.dataset.paper).toBe("moonWhite");
    expect(html.style.getPropertyValue("--m-paper-rgb")).toBe("248 250 252");
  });

  it("does not touch storage with storage=false", async () => {
    const screen = await render(MPaperTheme, { props: { storage: false } });
    await screen.getByRole("radio", { name: "茶染" }).click();
    expect(html.dataset.paper).toBe("teaStained");
    expect(localStorage.getItem(PAPER_THEME_STORAGE_KEY)).toBeNull();
  });

  it("shows only the given presets with custom labels", async () => {
    const screen = await render(MPaperTheme, {
      props: { presets: ["raw", "antique"], labels: { antique: "绢本" } },
    });
    expect(
      screen
        .getByRole("radio")
        .elements()
        .map((r) => r.textContent),
    ).toEqual(["生宣", "绢本"]);
  });

  it("follows v-model:preset", async () => {
    const screen = await render(MPaperTheme, { props: { preset: "teaStained" } });
    await expect
      .element(screen.getByRole("radio", { name: "茶染" }))
      .toHaveAttribute("aria-checked", "true");
    expect(html.dataset.paper).toBe("teaStained");
    await screen.rerender({ preset: "raw" });
    await expect
      .element(screen.getByRole("radio", { name: "生宣" }))
      .toHaveAttribute("aria-checked", "true");
    expect(html.dataset.paper).toBe("raw");
  });

  it("keeps the dark theme's paper: records data-paper but writes no variables while dark", async () => {
    html.dataset.theme = "dark";
    const screen = await render(MPaperTheme);
    await screen.getByRole("radio", { name: "古色" }).click();
    expect(html.dataset.paper).toBe("antique");
    expect(html.style.getPropertyValue("--m-paper-rgb")).toBe("");
    // 转回亮色，变量补上
    html.dataset.theme = "light";
    await expect.poll(() => html.style.getPropertyValue("--m-paper-rgb")).toBe("245 235 215");
    // 再转深色，变量撤掉
    html.dataset.theme = "dark";
    await expect.poll(() => html.style.getPropertyValue("--m-paper-rgb")).toBe("");
  });
});
