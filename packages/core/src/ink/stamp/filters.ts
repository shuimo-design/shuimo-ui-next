/**
 * 印章的两组 SVG 滤镜，全部按字号缩放（浏览器渲染的 <text> 用字号做基准最稳）：
 * - 印泥：一层四个 octave 的 fractalNoise 同时干两件事——R、G 通道给整体轮廓一点位移（边缘起毛，
 *   再裁回原形不会长出去），RGB 之和做阶梯透明，出印泥没压实的白斑
 * - 刀刻：腐蚀出内核 + 边带，边带位移，再用同一层噪声过阈值减掉崩口和石屑，最后与内核合回来
 *
 * 成本实测（2026-09-09，23 枚章每帧重绘）：开销和滤镜原语个数成正比、和像素面积基本无关，
 * 所以这里的原则是原语越少越好：每枚章 2 个 feTurbulence、15 个原语（原来 6 个 / 24 个）。
 */
export interface FilterRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InkFilterOptions {
  id: string;
  seed: number;
  /** 0 ~ 1，控制边缘位移幅度 */
  intensity: number;
  /** 边框厚度，位移最多推它的 0.7 */
  thickness: number;
  /** 渲染字号，噪声频率按 70 / fontSize 缩放 */
  fontSize: number;
  region: FilterRegion;
}

export interface TextFilterOptions {
  id: string;
  seed: number;
  /** 0 ~ 1 */
  intensity: number;
  fontSize: number;
  /** 阴章用重刀（崩口更多、腐蚀更深） */
  strong?: boolean;
  region: FilterRegion;
}

const REF_FONT = 70;

export function inkFilter(opts: InkFilterOptions): string {
  const seed = opts.seed | 0;
  const freqK = REF_FONT / Math.max(1, opts.fontSize);
  // 基频取原来云纹那档，四个 octave 一路翻到颗粒那档
  const baseFreq = 0.08 * freqK;
  const displacement = opts.thickness * 0.7 * clamp01(opts.intensity);
  // 阶梯表里的硬 0 才是白斑；插值成半透明灰就没有"印泥没压到"的感觉了
  const table = "0 0 0 0 0.2 0.4 0.6 0.75 0.88 0.95 1 1";
  return `<filter id="${opts.id}" ${regionAttrs(opts.region)}>
<feTurbulence type="fractalNoise" baseFrequency="${fmt(baseFreq)}" numOctaves="4" seed="${seed + 456}" result="noise"/>
<feDisplacementMap in="SourceGraphic" in2="noise" scale="${fmt(displacement)}" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
<feComposite in="displaced" in2="SourceGraphic" operator="in" result="shape"/>
<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 -0.6" result="noiseMask"/>
<feComponentTransfer in="noiseMask" result="contrast"><feFuncA type="discrete" tableValues="${table}"/></feComponentTransfer>
<feComposite in="shape" in2="contrast" operator="in"/>
</filter>`;
}

export function textFilter(opts: TextFilterOptions): string {
  const intensity = clamp01(opts.intensity);
  const seed = opts.seed | 0;
  const s = Math.max(0.2, opts.fontSize / REF_FONT);
  const subCapped = Math.sqrt(Math.min(s, 1.5));
  const fineFreq = 1 / subCapped;
  const amplitude = subCapped;
  const strong = opts.strong ?? false;
  const coreErode = (strong ? 0.14 : 0.18) * s;
  const edgeDisp = (strong ? 1.45 : 1.1) * intensity * amplitude;
  const edgeFreq = (strong ? 0.28 : 0.24) * fineFreq;
  // 阈值越负、过线的像素越少、崩口越少；强度低时把阈值再往下压。崩口和石屑共用一层噪声、一个阈值
  const chipThreshold = (strong ? -0.3 : -0.22) - (1 - intensity) * 0.5;
  return `<filter id="${opts.id}" ${regionAttrs(opts.region)}>
<feMorphology in="SourceGraphic" operator="erode" radius="${fmt(coreErode)}" result="core"/>
<feComposite in="SourceGraphic" in2="core" operator="out" result="edgeBand"/>
<feTurbulence type="fractalNoise" baseFrequency="${fmt(edgeFreq)}" numOctaves="3" seed="${seed}" result="noise"/>
<feDisplacementMap in="edgeBand" in2="noise" scale="${fmt(edgeDisp)}" xChannelSelector="R" yChannelSelector="G" result="displacedRaw"/>
<feComposite in="displacedRaw" in2="SourceGraphic" operator="in" result="displaced"/>
<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 ${fmt(chipThreshold)}" result="chipRaw"/>
<feComponentTransfer in="chipRaw" result="chipMask"><feFuncA type="discrete" tableValues="0 0 0 1 1 1 1"/></feComponentTransfer>
<feComposite in="displaced" in2="chipMask" operator="out" result="carvedEdge"/>
<feMerge><feMergeNode in="core"/><feMergeNode in="carvedEdge"/></feMerge>
</filter>`;
}

function regionAttrs(r: FilterRegion): string {
  return `filterUnits="userSpaceOnUse" x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.width)}" height="${fmt(r.height)}"`;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function fmt(v: number): string {
  if (Math.abs(v) < 1e-6) return "0";
  if (Math.round(v) === v) return String(Math.round(v));
  return v.toFixed(3);
}
