/** 调试：把每一层单独合成（纸色剪影 + 山体 + 线）成 RGBA 图，给 python 量 alpha 剖面。BENCH=1 vp test bench/scene-debug */
import { it } from "vitest";
import { commands } from "vitest/browser";
import { inkMountainScene } from "../src/ink/assets/mountain";

const PAPER = "#f4efe3";
const WASH = "#3c554e";

async function tint(url: string, w: number, h: number, color: string): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  return c;
}

it("dump layers", async () => {
  const scene = inkMountainScene({ seed: 3, side: "left" });
  for (const layer of scene.layers) {
    const c = document.createElement("canvas");
    c.width = scene.width;
    c.height = scene.height;
    const ctx = c.getContext("2d")!;
    // 只量山体：剪影是纸色垫底不算覆盖，线另算
    ctx.drawImage(
      await tint(layer.wash, c.width, c.height, layer.role === "ink" ? "#3b4542" : WASH),
      0,
      0,
    );
    await commands.writeFile(
      `bench/results/layer-${layer.name}.png.b64`,
      c.toDataURL("image/png").split(",")[1]!,
    );
    void PAPER;
  }
});
