/**
 * 印泥：一块无缝平铺的浓淡纹理。印泥按到纸上不会均匀，有的地方压得厚实，
 * 有的地方薄得透出纸色。瓦片整体画黑，只有 alpha 在起伏；当 mask-image 的第二层
 * 跟外形遮罩 intersect，印面里就带上厚薄不匀，边角偶尔露一点纸。角标的小方印用它。
 */
import { svgDoc, svgToDataUrl } from "./brush";

export interface InkPasteOptions {
  seed?: number;
  /** 瓦片边长 px，默认 48 */
  size?: number;
  /** 厚薄差 0–1：0 完全均匀，1 薄处几乎露纸；默认 0.45 */
  contrast?: number;
  /** 纹理粗细：噪声频率，越大颗粒越细，默认 0.16 */
  frequency?: number;
}

export interface InkPaste {
  url: string;
  /** 瓦片边长 px，给 mask-size 用 */
  size: number;
}

const cache = new Map<string, InkPaste>();

export function inkPasteUrl(options: InkPasteOptions = {}): InkPaste {
  const seed = options.seed ?? 1;
  const size = options.size ?? 48;
  const contrast = Math.min(1, Math.max(0, options.contrast ?? 0.45));
  const frequency = options.frequency ?? 0.16;
  const key = `${seed}:${size}:${contrast}:${frequency}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // 噪声红通道大致落在 0.25–0.75、中心 0.5。alpha = k·R + b：R 高于 0.55 的地方压实（alpha 钳到 1），
  // 往下随 contrast 变薄；contrast=1 时最薄处 alpha≈0.4，纸色明显透出来
  const k = 2 * contrast;
  const b = 1 - 1.1 * contrast;
  const filter =
    `<filter id="p" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" seed="${seed}" stitchTiles="stitch" result="n"/>` +
    `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${k} 0 0 0 ${b}"/></filter>`;
  const svg = svgDoc(
    { width: size, height: size },
    `${filter}<rect width="${size}" height="${size}" fill="#000" filter="url(#p)"/>`,
  );
  const paste = { url: svgToDataUrl(svg), size };
  cache.set(key, paste);
  return paste;
}
