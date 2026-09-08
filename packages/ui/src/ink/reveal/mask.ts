/**
 * 墨迹擦入遮罩：一张 2:1 的 SVG，左半黑（可见）右半透明，分界线被 feTurbulence 打成毛边并微微晕开。
 * 作为 mask-image 用 mask-size 200% 铺开，把 mask-position 从 100% 扫到 0% 就是"落墨"。
 */
export interface WipeMaskOptions {
  seed?: number;
  /** 毛边幅度（相对遮罩宽度的百分比），默认 6 */
  raggedness?: number;
  /** 边缘晕开，默认 1.5 */
  softness?: number;
  /** 扫入方向：right = 从左向右显现 */
  direction?: "right" | "left" | "down" | "up";
}

const cache = new Map<string, string>();

export function wipeMaskUrl(options: WipeMaskOptions = {}): string {
  const seed = options.seed ?? 7;
  const raggedness = options.raggedness ?? 6;
  const softness = options.softness ?? 1.5;
  const direction = options.direction ?? "right";
  const key = `${seed}:${raggedness}:${softness}:${direction}`;
  const hit = cache.get(key);
  if (hit) return hit;

  // 基准图是水平扫入（左黑右透明），其它方向靠旋转
  const W = 400;
  const H = 200;
  const size =
    direction === "right" || direction === "left"
      ? `width="${W}" height="${H}"`
      : `width="${H}" height="${W}"`;
  const viewBox = direction === "right" || direction === "left" ? `0 0 ${W} ${H}` : `0 0 ${H} ${W}`;
  const transform =
    direction === "right"
      ? ""
      : direction === "left"
        ? `transform="rotate(180 ${W / 2} ${H / 2})"`
        : direction === "down"
          ? `transform="translate(${H} 0) rotate(90)"`
          : `transform="translate(0 ${W}) rotate(-90)"`;
  const scale = (W * raggedness) / 100;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="${viewBox}">` +
    `<filter id="f" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="3" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
    `<feGaussianBlur in="d" stdDeviation="${softness}"/></filter>` +
    `<g ${transform}><rect x="-40" y="-40" width="${W / 2 + 40}" height="${H + 80}" fill="black" filter="url(#f)"/></g></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}
