/**
 * shuimo-core 生成耗时基准。数字决定远山是运行期实时生成还是构建期预生成。
 * 用法：pnpm bench            （默认 20 轮）
 *      pnpm bench -- 50       （指定轮数）
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { generateLandscape } from "@jobinjia/shuimo-core";

const rounds = Number(process.argv[2] ?? 20);
const sizes = [
  { name: "hero 1920x600", width: 1920, height: 600 },
  { name: "default 3000x800", width: 3000, height: 800 },
  { name: "mobile 800x500", width: 800, height: 500 },
];

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index] ?? 0;
}

interface Row {
  size: string;
  p50Ms: number;
  p95Ms: number;
  bytesKB: number;
  paths: number;
}

const rows: Row[] = [];
for (const size of sizes) {
  const times: number[] = [];
  let bytes = 0;
  let paths = 0;
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    const { svg } = generateLandscape({
      seed: 1000 + i,
      width: size.width,
      height: size.height,
      transparent: true,
      onXuanPaper: false,
    });
    times.push(performance.now() - t0);
    bytes = Buffer.byteLength(svg);
    paths = (svg.match(/<path\b/g) ?? []).length;
  }
  rows.push({
    size: size.name,
    p50Ms: Math.round(percentile(times, 50)),
    p95Ms: Math.round(percentile(times, 95)),
    bytesKB: Math.round(bytes / 1024),
    paths,
  });
}

console.table(rows);
mkdirSync("bench/results", { recursive: true });
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
writeFileSync(
  `bench/results/landscape-${stamp}.json`,
  JSON.stringify({ node: process.version, rounds, rows }, null, 2) + "\n",
);
