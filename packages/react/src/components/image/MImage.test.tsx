import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MImage } from ".";

/** 三张能立刻加载出来的图：内联 SVG，颜色不同 */
const picture = (color: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60"><rect width="80" height="60" fill="${color}"/></svg>`,
  );
const SHAN = picture("#1c1c1c");
const SHUI = picture("#1661ab");
const YUN = picture("#f7f4ec");
/** 解不出来的图：触发 error */
const BROKEN = "data:image/png;base64,AAAA";

const previewImg = () => document.querySelector<HTMLImageElement>(".m-image-preview__img");

/** 关掉预览并等它从 body 里卸掉，别把遮罩留给下一个用例 */
async function closePreview() {
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(document.querySelector(".m-image-preview")).toBeNull());
}

describe("MImage", () => {
  it("shows a placeholder until the image loads, then applies fit and size", async () => {
    const onLoad = vi.fn();
    const screen = await render(
      <MImage src={SHAN} alt="山" fit="cover" width={160} height={120} lazy onLoad={onLoad} />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    expect(root.classList.contains("m-image--cover")).toBe(true);
    expect(root.classList.contains("m-image--sized")).toBe(true);
    expect(root.style.getPropertyValue("--m-image-w")).toBe("160px");
    expect(root.style.getPropertyValue("--m-image-h")).toBe("120px");
    const img = screen.getByRole("img", { name: "山" });
    await expect.element(img).toHaveAttribute("loading", "lazy");
    await vi.waitFor(() => expect(root.classList.contains("m-image--loaded")).toBe(true));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(root.querySelector(".m-image__placeholder")).toBeNull();
    // 能预览：图进 Tab 序列
    await expect.element(img).toHaveAttribute("tabindex", "0");
  });

  it("falls back to the error slot when the image fails", async () => {
    const onError = vi.fn();
    const screen = await render(
      <MImage
        src={BROKEN}
        alt="坏图"
        width={120}
        height={80}
        onError={onError}
        renderError={() => <b>没有这张图</b>}
      />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    await vi.waitFor(() => expect(root.classList.contains("m-image--error")).toBe(true));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(root.querySelector(".m-image__error")?.textContent).toBe("没有这张图");
    // 失败的图点不开预览
    await page.elementLocator(root).click();
    expect(document.querySelector(".m-image-preview")).toBeNull();
  });

  it("shows the default error text without a slot", async () => {
    const screen = await render(<MImage src={BROKEN} alt="坏图" />);
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    await vi.waitFor(() => expect(root.querySelector(".m-image__error")).not.toBeNull());
    expect(root.querySelector(".m-image__error")?.textContent).toBe("加载失败");
  });

  it("opens a modal preview on click with zoom, rotate, reset and wheel", async () => {
    const onShow = vi.fn();
    const onClose = vi.fn();
    const screen = await render(
      <MImage src={SHAN} alt="山" width={160} height={120} onShow={onShow} onClose={onClose} />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    await vi.waitFor(() => expect(root.classList.contains("m-image--loaded")).toBe(true));
    const img = screen.getByRole("img", { name: "山" });
    await img.click();

    const dialog = page.getByRole("dialog", { name: "图片预览" });
    await expect.element(dialog).toBeVisible();
    await expect.element(dialog).toHaveAttribute("aria-modal", "true");
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe("hidden");
    await vi.waitFor(() => expect(dialog.element().contains(document.activeElement)).toBe(true));
    // 单张：没有翻页箭头和计数
    expect(document.querySelector(".m-image-preview__arrow")).toBeNull();
    expect(document.querySelector(".m-image-preview__counter")).toBeNull();

    expect(previewImg()?.style.transform).toBe("scale(1) rotate(0deg)");
    await page.getByRole("button", { name: "放大" }).click();
    expect(previewImg()?.style.transform).toBe("scale(1.2) rotate(0deg)");
    await page.getByRole("button", { name: "旋转" }).click();
    expect(previewImg()?.style.transform).toBe("scale(1.2) rotate(90deg)");
    await page.getByRole("button", { name: "缩小" }).click();
    await page.getByRole("button", { name: "缩小" }).click();
    expect(previewImg()?.style.transform).toBe("scale(0.8) rotate(90deg)");
    await page.getByRole("button", { name: "还原" }).click();
    expect(previewImg()?.style.transform).toBe("scale(1) rotate(0deg)");
    // 滚轮：往上滚放大
    previewImg()!.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(previewImg()?.style.transform).toBe("scale(1.2) rotate(0deg)"));

    await closePreview();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.overflow).toBe("");
    // 焦点还给打开它的图
    await vi.waitFor(() => expect(document.activeElement).toBe(img.element()));
  });

  it("closes from the close button and the mask", async () => {
    const onClose = vi.fn();
    const screen = await render(
      <MImage src={SHAN} alt="山" width={160} height={120} onClose={onClose} />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    await vi.waitFor(() => expect(root.classList.contains("m-image--loaded")).toBe(true));
    const img = screen.getByRole("img", { name: "山" });

    // 键盘也能打开
    img.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("dialog", { name: "图片预览" })).toBeVisible();
    // 挂牌一直在摆（rotate 动画），Playwright 等不到它"稳定"；人点得到，测试里跳过稳定性检查
    await page.getByRole("button", { name: "关闭" }).click({ force: true });
    await vi.waitFor(() => expect(document.querySelector(".m-image-preview")).toBeNull());
    expect(onClose).toHaveBeenCalledTimes(1);

    await img.click();
    await expect.element(page.getByRole("dialog", { name: "图片预览" })).toBeVisible();
    const mask = document.querySelector<HTMLElement>(".m-image-preview__mask")!;
    await page.elementLocator(mask).click({ position: { x: 4, y: 4 } });
    await vi.waitFor(() => expect(document.querySelector(".m-image-preview")).toBeNull());
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("walks a preview list with arrows and keys, wrapping at both ends", async () => {
    const screen = await render(
      <MImage src={SHUI} alt="水" width={160} height={120} previewSrcList={[SHAN, SHUI, YUN]} />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    await vi.waitFor(() => expect(root.classList.contains("m-image--loaded")).toBe(true));
    await screen.getByRole("img", { name: "水" }).click();
    await expect.element(page.getByRole("dialog", { name: "图片预览" })).toBeVisible();

    // 没给 initialIndex：从 src 在列表里的位置起
    const counter = () => document.querySelector(".m-image-preview__counter")?.textContent?.trim();
    expect(counter()).toBe("2 / 3");
    expect(previewImg()?.getAttribute("src")).toBe(SHUI);

    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() => expect(counter()).toBe("3 / 3"));
    expect(previewImg()?.getAttribute("src")).toBe(YUN);
    await userEvent.keyboard("{ArrowRight}");
    await vi.waitFor(() => expect(counter()).toBe("1 / 3"));
    expect(previewImg()?.getAttribute("src")).toBe(SHAN);
    await page.getByRole("button", { name: "上一张" }).click();
    await vi.waitFor(() => expect(counter()).toBe("3 / 3"));
    // 切图后变换归位
    await page.getByRole("button", { name: "放大" }).click();
    await page.getByRole("button", { name: "下一张" }).click();
    await vi.waitFor(() => expect(counter()).toBe("1 / 3"));
    expect(previewImg()?.style.transform).toBe("scale(1) rotate(0deg)");

    await closePreview();
  });

  it("starts from initialIndex when given", async () => {
    const screen = await render(
      <MImage
        src={SHUI}
        alt="水"
        width={160}
        height={120}
        previewSrcList={[SHAN, SHUI, YUN]}
        initialIndex={2}
      />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    await vi.waitFor(() => expect(root.classList.contains("m-image--loaded")).toBe(true));
    await screen.getByRole("img", { name: "水" }).click();
    await expect.element(page.getByRole("dialog", { name: "图片预览" })).toBeVisible();
    expect(document.querySelector(".m-image-preview__counter")?.textContent?.trim()).toBe("3 / 3");
    await closePreview();
  });

  it("does nothing on click when preview is off", async () => {
    const onShow = vi.fn();
    const screen = await render(
      <MImage src={SHAN} alt="山" width={160} height={120} preview={false} onShow={onShow} />,
    );
    const root = screen.container.querySelector<HTMLElement>(".m-image")!;
    await vi.waitFor(() => expect(root.classList.contains("m-image--loaded")).toBe(true));
    const img = screen.getByRole("img", { name: "山" });
    await expect.element(img).not.toHaveAttribute("tabindex");
    await img.click();
    expect(document.querySelector(".m-image-preview")).toBeNull();
    expect(onShow).not.toHaveBeenCalled();
  });
});
