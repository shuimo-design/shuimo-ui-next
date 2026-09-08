// 山水 Worker：SVG 字符串生成在这里做（约 150ms），主线程只做解码。
import { generateLandscapeLayers } from "./generate";
import type { LandscapeWorkerRequest, LandscapeWorkerResponse } from "./protocol";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<LandscapeWorkerRequest>) => void) | null;
  postMessage: (data: LandscapeWorkerResponse) => void;
};

scope.onmessage = (event) => {
  const { id, width, height, seed, layers } = event.data;
  try {
    const result = generateLandscapeLayers({ width, height, seed, layers });
    scope.postMessage({ id, ...result });
  } catch (error) {
    scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
