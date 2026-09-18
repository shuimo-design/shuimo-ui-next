import type { InkTier } from "../../ink/tier";

export type { InkTier };

/** 视差驱动方式：跟随滚动、跟随鼠标、不动 */
export type ShanShuiParallax = "scroll" | "pointer" | "none";
/** 配色：墨（跟随纸色）、晨（暖调天光）、暮（青灰天光、朱砂更重） */
export type ShanShuiPalette = "ink" | "dawn" | "dusk";

export interface ShanShuiProps {
  /** 生成种子；同 seed 同一幅山水（山形、日头位置、雁阵、孤舟都由它定）。默认 1 */
  seed?: number;
  /** 强制特效档位：0 纯色分层、不动；≥1 SVG 山水 + 视差。默认按设备检测 */
  tier?: InkTier;
  /** 横幅高度，数字按 px，默认 "60vh" */
  height?: string | number;
  /** 远山层数 2–5，默认 3 */
  layers?: number;
  /** 画朱砂日，默认 true */
  sun?: boolean;
  /** 画雁阵，默认 true */
  geese?: boolean;
  /** 画孤舟，默认 true */
  boat?: boolean;
  /** 视差：scroll 跟随滚动、pointer 跟随鼠标、none 不动。默认 scroll；prefers-reduced-motion 下自动不动 */
  parallax?: ShanShuiParallax;
  /** 配色：ink 跟随纸色，dawn 暖调，dusk 青灰。默认 ink */
  palette?: ShanShuiPalette;
}

export interface ShanShuiReadyPayload {
  seed: number;
  tier: InkTier;
}

export interface ShanShuiEmits {
  /** 全部图层解码完成、画面淡入时触发一次 */
  ready: [payload: ShanShuiReadyPayload];
}

export interface ShanShuiSlots {
  /** 覆盖在画面上的标题内容，居中 */
  default?: () => unknown;
}
