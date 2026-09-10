/**
 * 洇墨：加载动画。一团墨在纸上洇开又收回，SMIL 循环，SVG 当图片用也会动。
 * 由三层同心墨团组成：内层实、外层淡，各自的位移强度和缩放错相呼吸。
 */
import { createRng } from "../random";
import { blobPoints, svgDoc, svgToDataUrl } from "./brush";

export interface InkWashOptions {
  seed?: number;
  /** 画幅边长 px，默认 64 */
  size?: number;
  /** 一个循环的秒数，默认 2.4 */
  period?: number;
}

const cache = new Map<string, string>();

export function inkWashUrl(options: InkWashOptions = {}): string {
  const seed = options.seed ?? 1;
  const size = options.size ?? 64;
  const period = options.period ?? 2.4;
  const key = `${seed}:${size}:${period}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = createRng(seed * 17 + 9);
  const c = size / 2;
  const dur = `${period.toFixed(2)}s`;
  const layer = (r: number, opacity: number, ragged: number, delay: number, scaleFrom: number) =>
    `<g opacity="${opacity}">` +
    `<animateTransform attributeName="transform" type="scale" values="${scaleFrom};1;${scaleFrom}" dur="${dur}" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" additive="sum"/>` +
    `<polygon points="${blobPoints(0, 0, r, rng, ragged, 72)}" fill="#000"/></g>`;
  const filter =
    `<filter id="f" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d">` +
    `<animate attributeName="scale" values="2;7;2" dur="${dur}" repeatCount="indefinite"/></feDisplacementMap>` +
    `<feGaussianBlur in="d" stdDeviation="0.6"/></filter>`;
  const body =
    `<g transform="translate(${c} ${c})" filter="url(#f)">` +
    layer(size * 0.36, 0.28, 0.22, -0.6, 0.86) +
    layer(size * 0.27, 0.55, 0.16, -0.3, 0.9) +
    layer(size * 0.17, 1, 0.1, 0, 0.94) +
    `</g>`;
  const url = svgToDataUrl(svgDoc({ width: size, height: size }, `${filter}${body}`));
  cache.set(key, url);
  return url;
}
