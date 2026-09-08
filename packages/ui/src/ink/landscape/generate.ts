import { SceneManager, noise, prng } from "@jobinjia/shuimo-core";
import type { LandscapeLayerSvg } from "./protocol";

/**
 * 生成按深度分层的山水 SVG。
 * 用 SceneManager 拿到每个元素的 y（越大越近），按 y 分位数分桶；每桶一份完整 SVG 文档。
 * 注：shuimo-core 的 generatePainting 是私有拼装，拿不到分层；这里用它的公开积木重走一遍。
 * 缺 blankPosition / detail 支持，等 shuimo-core 补 generateLandscapeLayers 后替换。
 */
export function generateLandscapeLayers(input: {
  width: number;
  height: number;
  seed: number;
  layers: number;
}): { layers: LandscapeLayerSvg[]; polylines: number } {
  const { width, height, seed } = input;
  const layerCount = Math.max(1, Math.min(8, Math.floor(input.layers)));

  // shuimo-core 的 Perlin 表在第一次调用时才从 prng 取 4096 个数填充，之后不再变。
  // 不 reset 的话，同一 seed 在"首次"和"之后"会得到不同结果（也依赖历史 seed）。
  // 这里显式 reset，让噪声表总是从刚 seed 过的 prng 状态初始化。
  prng.seed(seed);
  noise.reset();
  const scene = new SceneManager(width, height, 512);
  scene.chunkLoader(0, width);
  const chunks = scene
    .getState()
    .chunks.filter(
      (chunk): chunk is typeof chunk & { canv: string } => typeof chunk.canv === "string",
    )
    .sort((a, b) => a.y - b.y);

  const buckets: string[][] = Array.from({ length: layerCount }, () => []);
  if (chunks.length > 0) {
    const ys = chunks.map((chunk) => chunk.y);
    const minY = ys[0]!;
    const maxY = ys[ys.length - 1]!;
    const span = Math.max(1, maxY - minY);
    for (const chunk of chunks) {
      const t = (chunk.y - minY) / span;
      const index = Math.min(layerCount - 1, Math.floor(t * layerCount));
      buckets[index]!.push(chunk.canv);
    }
  }

  let polylines = 0;
  const layers = buckets.map((parts, index) => {
    const body = parts.join("");
    polylines += (body.match(/<polyline\b/g) ?? []).length;
    return {
      depth: layerCount === 1 ? 1 : index / (layerCount - 1),
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g>${body}</g></svg>`,
    };
  });
  return { layers, polylines };
}
