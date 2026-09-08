/**
 * 宣纸生成基准（真 Chromium 里跑）：BENCH=1 pnpm bench:paper
 * 对比：主线程同步 xuanPaper() vs Worker 全图 vs 多 Worker 分块。
 */
import { it } from "vitest";
import { commands } from "vitest/browser";
import { xuanPaper } from "@jobinjia/shuimo-core";
import type {
  XuanPaperWorkerRequest,
  XuanPaperWorkerResponse,
} from "@jobinjia/shuimo-core/xuan-paper/worker-protocol";
import PaperWorker from "@jobinjia/shuimo-core/xuan-paper/worker?worker";

interface Row {
  case: string;
  ms: number;
  bitmapMs: number;
  blobKB: number;
}

function now() {
  return performance.now();
}

function runWorker(
  worker: Worker,
  request: XuanPaperWorkerRequest,
): Promise<{ blob: Blob; ms: number }> {
  return new Promise((resolvePromise, reject) => {
    const t0 = now();
    const onMessage = (event: MessageEvent<XuanPaperWorkerResponse>) => {
      if (event.data.id !== request.id) return;
      worker.removeEventListener("message", onMessage);
      if ("error" in event.data) reject(new Error(event.data.error));
      else resolvePromise({ blob: event.data.blob, ms: now() - t0 });
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage(request);
  });
}

async function bitmapTime(blob: Blob): Promise<number> {
  const t0 = now();
  const bitmap = await createImageBitmap(blob);
  bitmap.close();
  return now() - t0;
}

it("xuan paper generation timing", async () => {
  const rows: Row[] = [];
  const seed = 42;

  // 主线程同步（含 canvas 光栅化），这是旧路线，用来对照
  for (const size of [512, 1024]) {
    const t0 = now();
    const canvas = xuanPaper({ width: size, height: size, seed, deckleEdge: false });
    const ms = now() - t0;
    rows.push({ case: `main-thread ${size}²`, ms: Math.round(ms), bitmapMs: 0, blobKB: 0 });
    canvas.remove();
  }

  const worker = new PaperWorker();
  // 预热：第一次带 WASM 编译
  const warm = await runWorker(worker, {
    id: 0,
    options: { width: 256, height: 256, seed, deckleEdge: false },
  });
  rows.push({
    case: "worker warm-up 256² (incl. wasm compile)",
    ms: Math.round(warm.ms),
    bitmapMs: 0,
    blobKB: Math.round(warm.blob.size / 1024),
  });

  const cases: { name: string; options: XuanPaperWorkerRequest["options"] }[] = [
    { name: "worker 512² default", options: { width: 512, height: 512, seed, deckleEdge: false } },
    {
      name: "worker 512² no gold",
      options: { width: 512, height: 512, seed, deckleEdge: false, goldFlecks: false },
    },
    {
      name: "worker 512² low detail",
      options: {
        width: 512,
        height: 512,
        seed,
        deckleEdge: false,
        goldFlecks: false,
        fiberDensity: 0.4,
        grainDensity: 0.4,
      },
    },
    {
      name: "worker 1024² default",
      options: { width: 1024, height: 1024, seed, deckleEdge: false },
    },
    {
      name: "worker 2048² default",
      options: { width: 2048, height: 2048, seed, deckleEdge: false },
    },
    {
      name: "worker 1920×1080 with deckle",
      options: { width: 1920, height: 1080, seed, deckleEdge: true },
    },
  ];
  let id = 1;
  for (const c of cases) {
    const samples: number[] = [];
    let blob: Blob = new Blob();
    for (let i = 0; i < 3; i++) {
      const result = await runWorker(worker, { id: id++, options: c.options });
      samples.push(result.ms);
      blob = result.blob;
    }
    samples.sort((a, b) => a - b);
    rows.push({
      case: c.name,
      ms: Math.round(samples[1] ?? 0),
      bitmapMs: Math.round(await bitmapTime(blob)),
      blobKB: Math.round(blob.size / 1024),
    });
  }

  // 4 个 Worker 并行渲染 1024² 的四个 512² tile
  const workers = [new PaperWorker(), new PaperWorker(), new PaperWorker(), new PaperWorker()];
  await Promise.all(
    workers.map((w, i) =>
      runWorker(w, { id: 100 + i, options: { width: 64, height: 64, seed, deckleEdge: false } }),
    ),
  );
  const t0 = now();
  const tiles = await Promise.all(
    workers.map((w, i) =>
      runWorker(w, {
        id: 200 + i,
        options: { width: 1024, height: 1024, seed, deckleEdge: false },
        tile: { x: (i % 2) * 512, y: Math.floor(i / 2) * 512, width: 512, height: 512 },
      }),
    ),
  );
  rows.push({
    case: "4 workers × 512² tiles of 1024²",
    ms: Math.round(now() - t0),
    bitmapMs: 0,
    blobKB: Math.round(tiles.reduce((sum, t) => sum + t.blob.size, 0) / 1024),
  });

  worker.terminate();
  for (const w of workers) w.terminate();

  console.table(rows);
  // 浏览器里写不了文件，走 vitest 的 server command 落盘
  await commands.writeFile(
    "bench/results/xuan-paper-latest.json",
    JSON.stringify({ userAgent: navigator.userAgent, rows }, null, 2) + "\n",
  );
}, 180_000);
