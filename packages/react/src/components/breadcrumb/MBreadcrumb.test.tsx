import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MBreadcrumb, MBreadcrumbItem } from ".";

describe("MBreadcrumb", () => {
  it("renders items from options with a separator between them", async () => {
    const screen = await render(
      <MBreadcrumb
        options={[{ content: "首页", href: "#home" }, { content: "列表" }, { content: "详情" }]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "面包屑" });
    await expect.element(nav).toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "首页" }))
      .toHaveAttribute("href", "#home");
    await expect.element(screen.getByText("详情")).toBeVisible();
    const items = nav.element().querySelectorAll(".m-breadcrumb-item");
    expect(items.length).toBe(3);
    // 第一项前面的分隔符不显示，其余两项各一个
    const shown = [...nav.element().querySelectorAll(".m-breadcrumb-item__separator")].filter(
      (el) => getComputedStyle(el).display !== "none",
    );
    expect(shown.length).toBe(2);
  });

  it("renders children items and a custom separator text", async () => {
    const screen = await render(
      <MBreadcrumb separator=">">
        <MBreadcrumbItem>山</MBreadcrumbItem>
        <MBreadcrumbItem content="水" />
      </MBreadcrumb>,
    );
    await expect.element(screen.getByText("山")).toBeVisible();
    await expect.element(screen.getByText("水")).toBeVisible();
    const separators = screen.container.querySelectorAll(".m-breadcrumb-item__separator");
    expect(separators[1]?.textContent?.trim()).toBe(">");
    expect(screen.container.querySelector(".m-breadcrumb-item__slash")).toBeNull();
  });

  it("uses the separator node over the text", async () => {
    const screen = await render(
      <MBreadcrumb
        separator=">"
        separatorNode={<em data-testid="sep">→</em>}
        options={[{ content: "甲" }, { content: "乙" }]}
      />,
    );
    const seps = screen.getByTestId("sep").all();
    expect(seps.length).toBe(2);
    expect(screen.container.textContent).not.toContain(">");
  });
});
