/**
 * 抽屉四个方向 + 弹窗各渲染一张整屏图落盘，供人眼检查挂牌挂在哪条边、山景和挂牌有没有打架。
 * 两者的水墨外观是同一份（src/internal/modal-ink.css），改那里之后拿弹窗这张做逐像素回归：
 * BENCH=1 vp test bench/modal-sample
 * 落盘是 base64，看之前先解码：base64 -d < bench/results/drawer-right.png.b64 > /tmp/x.png
 */
import "../src/style.css";
import { it } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MDialog } from "../src/components/dialog";
import { MDrawer } from "../src/components/drawer";
import type { DrawerDirection } from "../src/components/drawer/types";
import { createInkEngine } from "../src/ink";

createInkEngine();

const DIRECTIONS: DrawerDirection[] = ["right", "left", "top", "bottom"];

for (const direction of DIRECTIONS) {
  it(`drawer ${direction}`, async () => {
    // vitest 的测试 iframe 默认只有三百多像素宽，抽屉根本放不下，先撑开
    await page.viewport(1280, 800);
    const horizontal = direction === "top" || direction === "bottom";
    const screen = await render(MDrawer, {
      props: { modelValue: true, direction, title: "方向", size: horizontal ? 240 : 360 },
      slots: { default: () => h("p", { style: "margin:0" }, `direction = ${direction}`) },
    });
    // 等笔触框和回纹画完（都要先量到面板尺寸）
    await new Promise((resolve) => setTimeout(resolve, 900));
    // save:false 时 vitest 直接把 base64 串还回来，不是 { base64 } 对象
    const shot: unknown = await page.screenshot({ base64: true, save: false });
    const b64 = typeof shot === "string" ? shot : (shot as { base64: string } | undefined)?.base64;
    if (!b64) throw new Error(`截图没拿到 base64：${JSON.stringify(shot)?.slice(0, 200)}`);
    await commands.writeFile(`bench/results/drawer-${direction}.png.b64`, b64);
    screen.unmount();
  });
}

// 弹窗也来一张：抽屉的水墨外观是从弹窗抽出来共用的，改动前后拿这张做逐像素回归
it("dialog", async () => {
  await page.viewport(1280, 800);
  const screen = await render(MDialog, {
    props: { modelValue: true, title: "山水" },
    slots: { default: () => h("p", { style: "margin:0" }, "君不见，黄河之水天上来") },
  });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const shot: unknown = await page.screenshot({ base64: true, save: false });
  const b64 = typeof shot === "string" ? shot : (shot as { base64: string } | undefined)?.base64;
  if (!b64) throw new Error("截图没拿到 base64");
  await commands.writeFile("bench/results/dialog-ref.png.b64", b64);
  screen.unmount();
});
