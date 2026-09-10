import type { GoldFleckOptions, PaperPreset } from "../../ink/paper";
import type { InkTier } from "../../ink/tier";

export type { GoldFleckOptions, PaperPreset };

export interface RicePaperProps {
  /** 生成种子；同 seed 同纸同山。不传则随机 */
  seed?: number;
  /** 强制特效档位：0 纯色纸，≥1 带纹理和远山。默认按设备检测 */
  tier?: InkTier;
  /** 纸色预设或自定义 RGB；默认跟随主题 token --m-paper-rgb */
  paper?: PaperPreset | [number, number, number];
  /** 纹理强度 0–1，默认 0.5 */
  grain?: number;
  /**
   * 洒金：true 用默认的金箔（密度 0.15、片径 1 ~ 7px、成簇 0.3、金色），传对象可调密度 density、
   * 尺寸 sizeRange、成簇 clustering、颜色 color（gold / paleGold / roseGold / copper / silver / bronze 或 RGB）
   */
  goldFlecks?: boolean | Omit<GoldFleckOptions, "seed">;
  /** 矢量纤维密度 0 ~ 4，默认 1；0 关掉 */
  fibers?: number;
  /** 矢量颗粒密度 0 ~ 1，默认 0.5；0 关掉 */
  particles?: number;
  /** 毛边 */
  deckleEdge?: boolean;
  /**
   * 底部两侧的远山（左右各远近两层 SVG 剪影）。默认开：这是旧站宣纸的标志性远景，
   * 四张 SVG 整个会话只生成一次，tier 0（省流量 / 减弱动效）下自动不画
   */
  landscape?: boolean;
  /** 远山跟随鼠标、滚动做视差，默认开；prefers-reduced-motion 下自动不动 */
  parallax?: boolean;
  /** 布局：auto 跟随内容；full-screen 铺满视口并自己滚动。默认 auto */
  layout?: "auto" | "full-screen";
}

export interface RicePaperReadyPayload {
  seed: number;
  tier: InkTier;
  /** 从挂载到纹理解码完成的毫秒数 */
  ms: number;
}

export interface RicePaperEmits {
  ready: [payload: RicePaperReadyPayload];
}

export interface RicePaperSlots {
  default?: () => unknown;
}
