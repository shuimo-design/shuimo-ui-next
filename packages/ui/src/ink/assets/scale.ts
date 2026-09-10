/**
 * 鱼鳞纹：一张可平铺的小瓦片，上下两排半圆鳞片错半格咬合，每片由几圈明暗交替的同心弧带组成。
 * 旧库按钮底上那层若有若无的纹理就是它。画黑色低透明度，铺在任何底色上都是轻微压暗，
 * 当 background-image 用（repeat，尺寸就是 width × height）。
 */
import { fmt, svgDoc, svgToDataUrl } from "./brush";

export interface InkScaleOptions {
  /** 瓦片宽 px（高是宽的一半），默认 19 */
  width?: number;
  /** 弧带圈数，默认 8 */
  rings?: number;
  /** 整体明暗强度 0–1，默认 1（最深的弧带约 12% 黑） */
  strength?: number;
}

export interface InkScale {
  url: string;
  width: number;
  height: number;
}

const cache = new Map<string, InkScale>();

export function inkScaleUrl(options: InkScaleOptions = {}): InkScale {
  const width = options.width ?? 19;
  const rings = Math.max(2, options.rings ?? 8);
  const strength = options.strength ?? 1;
  const key = `${width}:${rings}:${strength}`;
  const hit = cache.get(key);
  if (hit) return hit;

  // 内部用 4 倍坐标画（原图 76×38），最后靠 width/height 缩到瓦片尺寸，弧带边缘更干净
  const w = 76;
  const h = 38;
  const cx = w / 2;
  const cy = h;
  const radius = cx;
  // 一片鳞 = 以底边中点为圆心的半圆，再挖掉左右下方两片邻鳞盖住的部分
  const mask =
    `<mask id="s" maskUnits="userSpaceOnUse" x="-${w}" y="-${h}" width="${w * 3}" height="${h * 3}">` +
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#fff"/>` +
    `<circle cx="${fmt(cx + w / 2)}" cy="${fmt(cy + h / 2)}" r="${radius}" fill="#000"/>` +
    `<circle cx="${fmt(cx - w / 2)}" cy="${fmt(cy + h / 2)}" r="${radius}" fill="#000"/>` +
    `</mask>`;
  // 由外向内一圈圈画弧带：深浅交替，越靠里越窄
  const bands: string[] = [];
  let outer = radius;
  for (let i = 0; i < rings; i++) {
    const inner = radius * (1 - (i + 1) / rings) ** 0.85;
    const mid = (outer + inner) / 2;
    const opacity = (i % 2 === 0 ? 0.035 : 0.125) * strength;
    bands.push(
      `<circle cx="${cx}" cy="${cy}" r="${fmt(mid)}" fill="none" stroke="#000" stroke-width="${fmt(outer - inner)}" opacity="${fmt(opacity)}"/>`,
    );
    outer = inner;
  }
  const scale = `<g id="p" mask="url(#s)">${bands.join("")}</g>`;
  // 四个斜向邻位各放一份，瓦片四角接上就是错排鳞片
  const tiles = [
    [w / 2, -h / 2],
    [-w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ]
    .map(([x, y]) => `<use href="#p" x="${fmt(x!)}" y="${fmt(y!)}"/>`)
    .join("");
  const height = width / 2;
  const svg = svgDoc(
    { width, height, viewBox: `0 0 ${w} ${h}` },
    `<defs>${mask}</defs>${scale}${tiles}`,
  );
  const entry = { url: svgToDataUrl(svg), width, height };
  cache.set(key, entry);
  return entry;
}
