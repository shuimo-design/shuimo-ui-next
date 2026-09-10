/**
 * 册页：把一张卡片当成一页宣纸时要用的两样固定尺寸素材，MCard 的 m.ink 层直接引用。
 *  - 纸纹：一张白底的宣纸纹理。卡片用正片叠底把它压在纸色上，只留下颗粒和纤维的暗部，
 *    纸色本身由 CSS 变量决定，浅色、深色主题都成立（纹理若带自己的底色，深色主题下会把卡片整块提亮）。
 *  - 朱批：标题左侧那一小笔竖向笔触，3px 宽、24px 长，元素按 1.1em 高拉伸，比例基本不变。
 * 纹理是一张 384px 的 SVG（带矢量纤维，几十 KB），一页里可能有十几张卡，不能每张都写进 inline style；
 * 和 ensureInkAssets 一样写到 :root 变量上，所有卡片共用一张。
 */
import { paperTextureUrl } from "../paper";
import { brushLineUrl, type BrushLine } from "./line";

/** 纸纹的 :root 变量名 */
export const SHEET_TEXTURE_VAR = "--m-ink-sheet-texture";
/** 朱批笔触的 :root 变量名 */
export const SHEET_MARK_VAR = "--m-ink-sheet-mark";
/** 朱批画幅在粗细方向上的尺寸（含晕染余量），元素宽度按它设，笔画才不会被拉扁 */
export const SHEET_MARK_BAND_VAR = "--m-ink-sheet-mark-band";
/** 纸纹平铺单元边长 px，card.css 的 background-size 要和它一致 */
export const SHEET_TEXTURE_SIZE = 384;

export interface SheetAssetsOptions {
  seed?: number;
}

/** 册页纸纹：白底、颗粒偏轻、纤维少一些——卡片比整页背景小得多，纹理太重会抢内容 */
export function sheetTextureUrl(seed = 1): string {
  return paperTextureUrl({
    seed,
    baseColor: [255, 255, 255],
    grain: 0.3,
    fibers: 0.7,
    particles: 0.35,
    size: SHEET_TEXTURE_SIZE,
  });
}

/** 朱批：短短一竖，两端留白压到 2px，否则默认留白会吃掉大半长度只剩一个点 */
export function sheetMarkUrl(seed = 1): BrushLine {
  return brushLineUrl({
    seed,
    length: 24,
    thickness: 3,
    vertical: true,
    endPad: 2,
    wobble: 0.4,
    flyingWhite: 0.1,
  });
}

/**
 * 把册页素材写成 :root 变量，只写一次；SSR 阶段空操作。
 * 变量已经在（比如另一张卡先挂载了，或热更新后模块重载）就不再生成。
 */
export function ensureSheetAssets(options: SheetAssetsOptions = {}): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  if (root.getPropertyValue(SHEET_TEXTURE_VAR)) return;
  const seed = options.seed ?? 1;
  const mark = sheetMarkUrl(seed);
  root.setProperty(SHEET_TEXTURE_VAR, `url("${sheetTextureUrl(seed)}")`);
  root.setProperty(SHEET_MARK_VAR, `url("${mark.url}")`);
  root.setProperty(SHEET_MARK_BAND_VAR, `${mark.width}px`);
}
