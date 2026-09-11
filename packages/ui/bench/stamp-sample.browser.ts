/**
 * 印章渲染一张整屏图落盘，供人眼检查印文和边框之间的留白、刀刻和印泥的量。
 * BENCH=1 vp test bench/stamp-sample
 * 落盘是 base64，看之前先解码：base64 -d < bench/results/stamp.png.b64 > /tmp/x.png
 */
import "../src/style.css";
import { it } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-vue";
import { h } from "vue";
import { MStamp } from "../src/components/stamp";
import { createInkEngine } from "../src/ink";

createInkEngine();

it("stamp", async () => {
  await page.viewport(1280, 420);
  const screen = await render({
    render: () =>
      h(
        "div",
        { style: "display:flex;gap:24px;align-items:center;padding:24px;background:#f6f3ea" },
        [
          h(MStamp, { text: "水墨", seed: 7, size: 160 }),
          h(MStamp, { text: "水墨", mode: "yin", seed: 7, size: 160 }),
          h(MStamp, { text: ["水墨", "丹青"], shape: "square", seed: 7, size: 160 }),
          h(MStamp, { text: ["水墨", "丹青"], shape: "square", mode: "yin", seed: 7, size: 160 }),
          h(MStamp, { text: "听雨", shape: "circle", seed: 7, size: 160 }),
          h(MStamp, { text: "听雨", shape: "polygon", sides: 6, seed: 7, size: 160 }),
        ],
      ),
  });
  await new Promise((resolve) => setTimeout(resolve, 600));
  const shot: unknown = await page.screenshot({ base64: true, save: false });
  const b64 = typeof shot === "string" ? shot : (shot as { base64: string } | undefined)?.base64;
  if (!b64) throw new Error("截图没拿到 base64");
  await commands.writeFile("bench/results/stamp.png.b64", b64);
  screen.unmount();
});
