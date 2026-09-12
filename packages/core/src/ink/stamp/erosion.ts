/**
 * 边框磨损：把外圈（阳章还有内圈）加密后，每个顶点沿法线用两层噪声推一下。
 * 低频那层给整体一个缓慢起伏，高频那层出石头崩口的碎感。
 * 顶边全程满幅，其余三边从角到边中点按 sin 渐入，角上不崩、边中间最花——照 V1 的规矩。
 * 再在圈上挖几个缺口（外圈往里咬、内圈往外咬），深的能把边框咬断，这才是印章的残破。
 *
 * 幅度按边框厚度算而不按印章尺寸缩放：UI 里的章多在 100 ~ 200px，按 480px 参考尺寸缩下来只剩零点几像素，等于没有。
 */
import { createNoise2D, type Rng } from "../random";
import { ringBBox, type Point, type Ring } from "./shape";

/** 参考尺寸：噪声波长按 REF_SIZE / size 缩放，小章和大章一圈的起伏个数一样 */
export const REF_SIZE = 480;

export interface ErosionOptions {
  /** 0 ~ 1，0 原样返回 */
  roughness: number;
  /** 边框厚度，起伏幅度最大到它的一半、缺口最深咬到它的九成 */
  thickness: number;
  /** 印章最大边长 */
  size: number;
}

export function erodeRings(rings: Ring[], opts: ErosionOptions, rng: Rng): Ring[] {
  const roughness = Math.min(1, Math.max(0, opts.roughness));
  if (roughness <= 0) return rings;
  const freqScale = opts.size > 0 ? REF_SIZE / opts.size : 1;
  const amp = roughness * opts.thickness * 0.5;
  const noiseLo = createNoise2D(rng);
  const noiseHi = createNoise2D(rng);
  return rings.map((ring, ringIdx) => {
    const dense = densify(ring, 3);
    // 内圈幅度收一点，免得外圈往里、内圈往外同时推到一处把边框推断
    const ringAmp = ringIdx === 0 ? amp : amp * 0.7;
    const wobbled = perturbRing(dense, noiseLo, noiseHi, ringAmp, freqScale, ringIdx * 113);
    // 缺口数量跟粗糙度走；内圈少一点
    const chips = Math.round((ringIdx === 0 ? 2 : 1) + roughness * (ringIdx === 0 ? 5 : 3));
    return chipRing(wobbled, chips, opts.thickness, roughness, ringIdx === 0, rng);
  });
}

/**
 * 在圈上挖缺口：随机挑一段顶点，按 cos² 的鼓包往边框材料里推。
 * inward 为 true 是外圈（往中心推），否则是内圈（往外推）。
 */
function chipRing(
  ring: Ring,
  count: number,
  thickness: number,
  roughness: number,
  inward: boolean,
  rng: Rng,
): Ring {
  if (ring.length < 8 || count <= 0) return ring;
  let cx = 0;
  let cy = 0;
  for (const [x, y] of ring) {
    cx += x;
    cy += y;
  }
  cx /= ring.length;
  cy /= ring.length;
  const out: Ring = ring.map(([x, y]) => [x, y] as Point);
  for (let k = 0; k < count; k++) {
    const center = Math.floor(rng() * ring.length);
    // 缺口宽度按厚度算：窄的像磕掉一块，宽的像磨秃一截
    const half = Math.max(2, Math.round((thickness * (1.2 + rng() * 2.2)) / 3));
    const depth = thickness * (0.35 + rng() * 0.55) * Math.sqrt(roughness);
    for (let d = -half; d <= half; d++) {
      const i = (center + d + ring.length) % ring.length;
      const [x, y] = ring[i]!;
      const t = d / half;
      const bump = Math.cos((t * Math.PI) / 2) ** 2;
      let nx = cx - x;
      let ny = cy - y;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      if (!inward) {
        nx = -nx;
        ny = -ny;
      }
      const cur = out[i]!;
      out[i] = [cur[0] + nx * depth * bump, cur[1] + ny * depth * bump];
    }
  }
  return out;
}

function densify(ring: Ring, maxLen: number): Ring {
  if (ring.length < 2) return ring;
  const out: Ring = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    out.push(a);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len > maxLen) {
      const n = Math.ceil(len / maxLen);
      for (let k = 1; k < n; k++) {
        const t = k / n;
        out.push([a[0] + dx * t, a[1] + dy * t]);
      }
    }
  }
  return out;
}

function perturbRing(
  ring: Ring,
  noiseLo: (x: number, y: number) => number,
  noiseHi: (x: number, y: number) => number,
  amp: number,
  freqScale: number,
  salt: number,
): Ring {
  const bb = ringBBox(ring);
  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  const edgeThreshold = Math.max(w, h) * 0.12;
  const loFreq = 0.03 * freqScale;
  const hiFreq = 0.18 * freqScale;
  return ring.map(([x, y], i) => {
    const prev = ring[(i - 1 + ring.length) % ring.length]!;
    const next = ring[(i + 1) % ring.length]!;
    const ex = next[0] - prev[0];
    const ey = next[1] - prev[1];
    const elen = Math.hypot(ex, ey) || 1;
    const nx = ey / elen;
    const ny = -ex / elen;

    const dTop = Math.abs(y - bb.y1);
    const dBot = Math.abs(y - bb.y2);
    const dLeft = Math.abs(x - bb.x1);
    const dRight = Math.abs(x - bb.x2);
    const nearest = Math.min(dTop, dBot, dLeft, dRight);
    let progress: number;
    if (nearest === dTop && dTop < edgeThreshold) {
      progress = 1;
    } else {
      // 沿着这条边、离最近的角有多远（0 在角上，1 在边中点）
      const alongEdge =
        nearest === dBot ? Math.min(x - bb.x1, bb.x2 - x) : Math.min(y - bb.y1, bb.y2 - y);
      const halfLen = nearest === dBot ? w / 2 : h / 2;
      const t = Math.min(1, alongEdge / Math.max(1, halfLen));
      progress = Math.sin(t * Math.PI * 0.5);
    }
    const lo = noiseLo(x * loFreq + salt * 13.7, y * loFreq + salt * 13.7);
    const hi = noiseHi(x * hiFreq + salt * 7.3, y * hiFreq + salt * 7.3);
    const offset = (lo * 0.3 + hi * 0.7) * amp * progress;
    return [x + nx * offset, y + ny * offset] as Point;
  });
}
