import type {
  LandscapeLayerSvg,
  LandscapeWorkerRequest,
  LandscapeWorkerResponse,
} from "./protocol";

export type { LandscapeLayerSvg } from "./protocol";

export interface LandscapeOptions {
  seed?: number;
  /** 视差层数，默认 4 */
  layers?: number;
}

export interface LandscapeLayer {
  depth: number;
  bitmap: ImageBitmap;
}

export interface LandscapeResult {
  layers: LandscapeLayer[];
  seed: number;
  polylines: number;
}

export interface LandscapeRendererOptions {
  createWorker?: () => Worker;
}

export interface LandscapeRenderer {
  render(width: number, height: number, options?: LandscapeOptions): Promise<LandscapeResult>;
  dispose(): void;
}

function defaultCreateWorker(): Worker {
  const file = "./landscape-worker.js";
  return new Worker(new URL(file, import.meta.url), { type: "module" });
}

/** SVG 文档字符串 → ImageBitmap。Chromium 的 createImageBitmap 不吃 SVG blob，走 Image 解码 */
async function rasterize(svg: string, width: number, height: number): Promise<ImageBitmap> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image(width, height);
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return await createImageBitmap(image, { resizeWidth: width, resizeHeight: height });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createLandscapeRenderer(options: LandscapeRendererOptions = {}): LandscapeRenderer {
  const createWorker = options.createWorker ?? defaultCreateWorker;
  let worker: Worker | undefined;
  let nextId = 1;
  const pending = new Map<
    number,
    {
      resolve: (layers: LandscapeLayerSvg[], polylines: number) => void;
      reject: (e: Error) => void;
    }
  >();

  function getWorker(): Worker {
    if (worker) return worker;
    worker = createWorker();
    worker.addEventListener("message", (event: MessageEvent<LandscapeWorkerResponse>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      if ("error" in event.data) entry.reject(new Error(event.data.error));
      else entry.resolve(event.data.layers, event.data.polylines);
    });
    worker.addEventListener("error", (event) => {
      const error = new Error(event.message || "landscape worker crashed");
      for (const entry of pending.values()) entry.reject(error);
      pending.clear();
    });
    return worker;
  }

  function generate(request: Omit<LandscapeWorkerRequest, "id">) {
    return new Promise<{ layers: LandscapeLayerSvg[]; polylines: number }>((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve: (layers, polylines) => resolve({ layers, polylines }), reject });
      getWorker().postMessage({ id, ...request } satisfies LandscapeWorkerRequest);
    });
  }

  return {
    async render(width, height, renderOptions = {}) {
      const seed = renderOptions.seed ?? Math.floor(Math.random() * 2 ** 31);
      const layerCount = renderOptions.layers ?? 4;
      const { layers, polylines } = await generate({ width, height, seed, layers: layerCount });
      const bitmaps = await Promise.all(layers.map((layer) => rasterize(layer.svg, width, height)));
      return {
        seed,
        polylines,
        layers: layers.map((layer, index) => ({ depth: layer.depth, bitmap: bitmaps[index]! })),
      };
    },
    dispose() {
      worker?.terminate();
      worker = undefined;
      pending.clear();
    },
  };
}
