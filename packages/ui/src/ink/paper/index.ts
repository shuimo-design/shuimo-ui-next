import type {
  XuanPaperWorkerRequest,
  XuanPaperWorkerResponse,
} from "@jobinjia/shuimo-core/xuan-paper/worker-protocol";

type XuanPaperOptions = XuanPaperWorkerRequest["options"];

/** 除尺寸外的宣纸参数，直接透传给 shuimo-core */
export type PaperOptions = Omit<XuanPaperOptions, "width" | "height" | "mode">;

export interface PaperRendererOptions {
  /** 并行 Worker 数，默认 min(4, hardwareConcurrency)。1 表示不分块 */
  workers?: number;
  /** 自定义 Worker 工厂；测试和特殊打包环境用。默认加载同目录的 paper.worker.js */
  createWorker?: () => Worker;
}

export interface PaperRenderer {
  /** 生成一张 width×height 的宣纸，结果是 ImageBitmap（调用方负责 close） */
  render(width: number, height: number, options?: PaperOptions): Promise<ImageBitmap>;
  dispose(): void;
}

interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
}

function defaultCreateWorker(): Worker {
  // 用变量拼 URL，避免打包器把它当静态资源去解析；dist 里这个文件由 pack 的 paper.worker 入口产出
  const file = "./paper-worker.js";
  return new Worker(new URL(file, import.meta.url), { type: "module" });
}

function splitTiles(width: number, height: number, count: number): Tile[] {
  if (count <= 1) return [{ x: 0, y: 0, width, height }];
  const cols = count >= 4 ? 2 : count;
  const rows = Math.ceil(count / cols);
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.floor((width * c) / cols);
      const y = Math.floor((height * r) / rows);
      const x2 = Math.floor((width * (c + 1)) / cols);
      const y2 = Math.floor((height * (r + 1)) / rows);
      tiles.push({ x, y, width: x2 - x, height: y2 - y });
    }
  }
  return tiles;
}

class WorkerLane {
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (blob: Blob) => void; reject: (error: Error) => void }
  >();

  constructor(readonly worker: Worker) {
    worker.addEventListener("message", (event: MessageEvent<XuanPaperWorkerResponse>) => {
      const entry = this.pending.get(event.data.id);
      if (!entry) return;
      this.pending.delete(event.data.id);
      if ("error" in event.data) entry.reject(new Error(event.data.error));
      else entry.resolve(event.data.blob);
    });
    worker.addEventListener("error", (event) => {
      const error = new Error(event.message || "paper worker crashed");
      for (const entry of this.pending.values()) entry.reject(error);
      this.pending.clear();
    });
  }

  request(options: XuanPaperOptions, tile?: Tile): Promise<Blob> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const message: XuanPaperWorkerRequest = tile ? { id, options, tile } : { id, options };
      this.worker.postMessage(message);
    });
  }
}

/**
 * 多 Worker 分块渲染宣纸。策略见 docs/PLAN.md §4：按 viewport 整张生成、不平铺。
 * 需要 OffscreenCanvas + Worker；不支持时回退到主线程同步生成。
 */
export function createPaperRenderer(options: PaperRendererOptions = {}): PaperRenderer {
  const supportsWorkers = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";
  const workerCount = supportsWorkers
    ? Math.max(1, options.workers ?? Math.min(4, navigator.hardwareConcurrency || 2))
    : 0;
  const createWorker = options.createWorker ?? defaultCreateWorker;
  let lanes: WorkerLane[] | undefined;

  function getLanes(): WorkerLane[] {
    lanes ??= Array.from({ length: workerCount }, () => new WorkerLane(createWorker()));
    return lanes;
  }

  async function renderOnMainThread(
    width: number,
    height: number,
    paperOptions: PaperOptions,
  ): Promise<ImageBitmap> {
    const { xuanPaper } = await import("@jobinjia/shuimo-core");
    const canvas = xuanPaper({ ...paperOptions, width, height, mode: "canvas" });
    return createImageBitmap(canvas);
  }

  return {
    async render(width, height, paperOptions = {}) {
      if (workerCount === 0) return renderOnMainThread(width, height, paperOptions);

      const full: XuanPaperOptions = { ...paperOptions, width, height };
      const tiles = splitTiles(width, height, workerCount);
      const activeLanes = getLanes();
      const blobs = await Promise.all(
        tiles.map((tile, index) =>
          activeLanes[index % activeLanes.length]!.request(
            full,
            tiles.length > 1 ? tile : undefined,
          ),
        ),
      );

      if (tiles.length === 1) return createImageBitmap(blobs[0]!);

      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("OffscreenCanvas 2d context unavailable");
      const bitmaps = await Promise.all(blobs.map((blob) => createImageBitmap(blob)));
      bitmaps.forEach((bitmap, index) => {
        const tile = tiles[index]!;
        ctx.drawImage(bitmap, tile.x, tile.y);
        bitmap.close();
      });
      return canvas.transferToImageBitmap();
    },
    dispose() {
      for (const lane of lanes ?? []) lane.worker.terminate();
      lanes = undefined;
    },
  };
}
