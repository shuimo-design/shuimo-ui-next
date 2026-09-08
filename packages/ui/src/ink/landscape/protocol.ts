export interface LandscapeLayerSvg {
  /** 0 = 最远，1 = 最近 */
  depth: number;
  svg: string;
}

export interface LandscapeWorkerRequest {
  id: number;
  width: number;
  height: number;
  seed: number;
  /** 拆成几层，默认 4 */
  layers: number;
}

export type LandscapeWorkerResponse =
  | { id: number; layers: LandscapeLayerSvg[]; polylines: number }
  | { id: number; error: string };
