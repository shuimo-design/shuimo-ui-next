import type { InkTier } from "../../ink/tier";

export type PaperPreset = "raw" | "processed" | "antique" | "teaStained" | "moonWhite";

export interface RicePaperProps {
  /** 生成种子；同 seed 同纸同山。不传则随机 */
  seed?: number;
  /** 强制特效档位：0 纯色纸，1 纸 + 山 + 视差，2 再加墨晕。默认按设备检测 */
  tier?: InkTier;
  /** 纸色预设或自定义 RGB；默认跟随主题 token --m-paper-rgb */
  paper?: PaperPreset | [number, number, number];
  /** 洒金 */
  goldFlecks?: boolean;
  /** 毛边 */
  deckleEdge?: boolean;
  /** 是否画远山 */
  mountains?: boolean;
  /** 远山层数，默认 4 */
  layers?: number;
  /** 远山整体不透明度，默认 0.55 */
  mountainsOpacity?: number;
  /** 视差最大位移 px，默认 24；0 关闭 */
  parallax?: number;
}

export interface RicePaperReadyPayload {
  seed: number;
  tier: InkTier;
  polylines: number;
  /** 从挂载到画完的毫秒数 */
  ms: number;
}

export interface RicePaperEmits {
  ready: [payload: RicePaperReadyPayload];
}

export interface RicePaperSlots {
  default?: () => unknown;
}
