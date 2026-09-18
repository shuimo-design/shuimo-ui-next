/**
 * 水印的无框架部分。
 *
 * 水印是一张平铺的 SVG：一个单元里放一段（多行）文字或一张图，转一个角度，
 * 单元的尺寸 = 旋转后的包围盒 + 间距。SVG 直接拼成 data URL，不量 DOM、不用 canvas，
 * 服务端也能出，客户端首帧和服务端一字不差。
 *
 * 文字画成黑色，套在 mask 上、墨色由 CSS 变量给：这样淡墨跟随深浅主题，
 * 水墨皮那层只是把 mask 换成带晕染滤镜的那张。图片模式没有墨色可言，走 background-image。
 *
 * 防篡改是唯一碰 DOM 的地方：控制器用 MutationObserver 盯着水印层，被删就贴回去，
 * class / style 被改就按壳最近一次给的那份重写。壳里一个 MutationObserver 都不出现。
 */
import { bleedFilter, svgDoc, svgToDataUrl } from "../../ink/assets/brush";
import type { Controller } from "../../runtime/controller";
import { createStore } from "../../runtime/store";
import type { WatermarkFont, WatermarkProps } from "./types";

export type { WatermarkFont, WatermarkProps, WatermarkSlots } from "./types";

/** 默认字号 px */
export const WATERMARK_FONT_SIZE = 14;
/** 默认字重 */
export const WATERMARK_FONT_WEIGHT = 400;
/**
 * 默认字体族。平铺图是一张独立的 SVG，读不到页面的 CSS 变量，所以只能写一串具体的衬线字：
 * 先找思源宋体、宋体，没装就退到系统衬线字
 */
export const WATERMARK_FONT_FAMILY = '"Noto Serif CJK SC", "Songti SC", "SimSun", serif';
/** 默认旋转角度 deg */
export const WATERMARK_ROTATE = -22;
/** 默认间距 px */
export const WATERMARK_GAP: readonly [number, number] = [100, 100];
/** 默认 z-index */
export const WATERMARK_Z_INDEX = 9;
/** 默认种子 */
export const WATERMARK_SEED = 1;
/** 没传尺寸时图片的默认宽高 px */
export const WATERMARK_IMAGE_SIZE: readonly [number, number] = [120, 64];
/** 文字行高（字号的倍数） */
const LINE_HEIGHT = 1.4;
/** 估算宽度时非全角字符按字号的这个比例算 */
const HALF_WIDTH_RATIO = 0.6;

/* ── 归一化 ─────────────────────────────────────────────────── */

export interface WatermarkResolved {
  /** 按行拆好的文字；图片模式下为空数组 */
  lines: string[];
  image: string | undefined;
  fontSize: number;
  fontFamily: string;
  fontWeight: number | string;
  color: string | undefined;
  rotate: number;
  gap: [number, number];
  offset: [number, number];
  /** 单个水印（未旋转）的宽高 */
  width: number;
  height: number;
  zIndex: number;
  /** 文字模式且要晕染；图片模式下恒为 false */
  ink: boolean;
  seed: number;
}

/** 按行拆文字：字符串是一行，数组每项一行；空行去掉 */
export function watermarkLines(content: string | string[] | undefined): string[] {
  if (content === undefined) return [];
  const lines = Array.isArray(content) ? content : [content];
  return lines.map((line) => String(line)).filter((line) => line.length > 0);
}

/** 全角字符（中日韩、全角标点）按一个字号算宽，其余按字号的 0.6 */
function charWidth(char: string, fontSize: number): number {
  const code = char.codePointAt(0) ?? 0;
  const wide =
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x20000 && code <= 0x3fffd);
  return wide ? fontSize : fontSize * HALF_WIDTH_RATIO;
}

/** 没传 width / height 时按字号估算文字块的宽高；纯算术，不量 DOM */
export function watermarkTextSize(lines: string[], fontSize: number): [number, number] {
  let width = 0;
  for (const line of lines) {
    let lineWidth = 0;
    for (const char of Array.from(line)) lineWidth += charWidth(char, fontSize);
    width = Math.max(width, lineWidth);
  }
  return [Math.ceil(width), Math.ceil(lines.length * fontSize * LINE_HEIGHT)];
}

export function resolveWatermark(props: WatermarkProps): WatermarkResolved {
  const font: WatermarkFont = props.font ?? {};
  const fontSize = font.size ?? WATERMARK_FONT_SIZE;
  const image = props.image || undefined;
  const lines = image ? [] : watermarkLines(props.content);
  const gap: [number, number] = props.gap ? [props.gap[0], props.gap[1]] : [...WATERMARK_GAP];
  const [estimatedWidth, estimatedHeight] = image
    ? WATERMARK_IMAGE_SIZE
    : watermarkTextSize(lines, fontSize);
  return {
    lines,
    image,
    fontSize,
    fontFamily: font.family ?? WATERMARK_FONT_FAMILY,
    fontWeight: font.weight ?? WATERMARK_FONT_WEIGHT,
    color: font.color,
    rotate: props.rotate ?? WATERMARK_ROTATE,
    gap,
    offset: props.offset ? [props.offset[0], props.offset[1]] : [gap[0] / 2, gap[1] / 2],
    width: props.width ?? estimatedWidth,
    height: props.height ?? estimatedHeight,
    zIndex: props.zIndex ?? WATERMARK_Z_INDEX,
    ink: !image && (props.ink ?? true),
    seed: props.seed ?? WATERMARK_SEED,
  };
}

/* ── SVG ────────────────────────────────────────────────────── */

/** 旋转后的包围盒再加上间距，就是平铺单元的尺寸 */
export function watermarkTile(o: {
  width: number;
  height: number;
  rotate: number;
  gap: [number, number];
}): [number, number] {
  const rad = (o.rotate * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  // 先抹掉三角函数的浮点尾巴（cos 90° 是 6e-17），不然 20 会被 ceil 成 21
  const up = (v: number) => Math.ceil(Math.round(v * 100) / 100);
  return [
    up(o.width * cos + o.height * sin + o.gap[0]),
    up(o.width * sin + o.height * cos + o.gap[1]),
  ];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export interface WatermarkSvgOptions {
  lines: string[];
  image?: string | undefined;
  fontSize: number;
  fontFamily: string;
  fontWeight: number | string;
  rotate: number;
  gap: [number, number];
  width: number;
  height: number;
  /** 文字套晕染滤镜 */
  ink: boolean;
  seed: number;
}

/**
 * 一个平铺单元的 SVG 标记。文字一律画黑（当 mask 用，墨色由 CSS 变量决定）；
 * 图片按 contain 放进 width × height 的框里。
 */
export function watermarkSvg(o: WatermarkSvgOptions): string {
  const [tileWidth, tileHeight] = watermarkTile(o);
  const transform = `translate(${fmt(tileWidth / 2)} ${fmt(tileHeight / 2)}) rotate(${fmt(o.rotate)})`;
  let body: string;
  let defs = "";
  if (o.image) {
    body =
      `<image href="${escapeXml(o.image)}" x="${fmt(-o.width / 2)}" y="${fmt(-o.height / 2)}" ` +
      `width="${fmt(o.width)}" height="${fmt(o.height)}" preserveAspectRatio="xMidYMid meet"/>`;
  } else {
    const lineHeight = o.fontSize * LINE_HEIGHT;
    const top = -((o.lines.length - 1) * lineHeight) / 2;
    const spans = o.lines
      .map(
        (line, index) =>
          `<tspan x="0" y="${fmt(top + index * lineHeight)}">${escapeXml(line)}</tspan>`,
      )
      .join("");
    body =
      `<text text-anchor="middle" dominant-baseline="central" fill="#000" ` +
      `font-family="${escapeXml(o.fontFamily)}" font-size="${fmt(o.fontSize)}" ` +
      `font-weight="${escapeXml(String(o.fontWeight))}">${spans}</text>`;
    if (o.ink) {
      // 位移量跟着字号走：小字位移 1px 就够毛，大字要更多才看得出洇
      const scale = Math.min(4, Math.max(1, o.fontSize * 0.15));
      defs = bleedFilter("b", o.seed, { frequency: 0.05, scale, blur: 0.3 });
      body = `<g filter="url(#b)">${body}</g>`;
    }
  }
  return svgDoc(
    { width: tileWidth, height: tileHeight },
    `${defs}<g transform="${transform}">${body}</g>`,
  );
}

const cache = new Map<string, string>();

/** watermarkSvg 的 data URL 版本，同参数复用 */
export function watermarkUrl(o: WatermarkSvgOptions): string {
  const key = JSON.stringify([
    o.lines,
    o.image ?? "",
    o.fontSize,
    o.fontFamily,
    o.fontWeight,
    o.rotate,
    o.gap,
    o.width,
    o.height,
    o.ink,
    o.seed,
  ]);
  const hit = cache.get(key);
  if (hit) return hit;
  const url = svgToDataUrl(watermarkSvg(o));
  cache.set(key, url);
  return url;
}

/* ── class / style ─────────────────────────────────────────── */

export function watermarkClasses(o: { image: boolean; ink: boolean }): string[] {
  return [
    "m-watermark",
    o.image ? "m-watermark--image" : "m-watermark--text",
    ...(o.ink ? ["m-watermark--ink"] : []),
  ];
}

/**
 * 水印层的内联变量。普通皮肤用干净的那张图，水墨皮（m.ink 层）换成带晕染的那张；
 * 两张都在这里给出，切皮肤不用重新算
 */
export function watermarkStyle(r: WatermarkResolved): Record<string, string> {
  const base: WatermarkSvgOptions = {
    lines: r.lines,
    image: r.image,
    fontSize: r.fontSize,
    fontFamily: r.fontFamily,
    fontWeight: r.fontWeight,
    rotate: r.rotate,
    gap: r.gap,
    width: r.width,
    height: r.height,
    ink: false,
    seed: r.seed,
  };
  const [tileWidth, tileHeight] = watermarkTile(r);
  const plain = watermarkUrl(base);
  const inked = r.ink ? watermarkUrl({ ...base, ink: true }) : plain;
  return {
    "--m-watermark-image": `url("${plain}")`,
    "--m-watermark-image-ink": `url("${inked}")`,
    "--m-watermark-tile": `${tileWidth}px ${tileHeight}px`,
    "--m-watermark-offset": `${r.offset[0]}px ${r.offset[1]}px`,
    "--m-watermark-z": String(r.zIndex),
    ...(r.color ? { "--m-watermark-color": r.color } : {}),
  };
}

/* ── 防篡改控制器 ──────────────────────────────────────────── */

/** 水印层的 class 名 */
export const WATERMARK_LAYER_CLASS = "m-watermark__layer";

export interface WatermarkGuardOptions {
  /** 水印层应有的内联样式（watermarkStyle 的结果），被改了就按这份重写 */
  style: Record<string, string>;
}

export interface WatermarkSnapshot {
  /** 被删或被改之后贴回去的次数 */
  readonly restores: number;
}

export interface WatermarkController extends Controller<WatermarkSnapshot, WatermarkGuardOptions> {
  /** 根元素：水印层被摘掉时贴回这里 */
  attach(root: HTMLElement | null): void;
  /** 水印层本身 */
  setLayer(el: HTMLElement | null): void;
}

const SERVER_SNAPSHOT: WatermarkSnapshot = { restores: 0 };

/** 水印层上允许存在的属性；别的（hidden 之类）出现了就摘掉 */
const ALLOWED_ATTRIBUTES = new Set(["class", "style", "aria-hidden"]);

/** 内联样式和应有的那份是否逐条相同；多出来的、少了的、值不同的都算不同 */
function styleMatches(el: HTMLElement, expected: Record<string, string>): boolean {
  const keys = Object.keys(expected);
  if (el.style.length !== keys.length) return false;
  return keys.every((key) => el.style.getPropertyValue(key).trim() === expected[key]);
}

export function createWatermark(initial: WatermarkGuardOptions): WatermarkController {
  const store = createStore<WatermarkSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let root: HTMLElement | null = null;
  let layer: HTMLElement | null = null;
  let connected = false;
  let observer: MutationObserver | undefined;

  /** 把水印层按应有的样子重写一遍 */
  function restore(el: HTMLElement): void {
    for (const name of el.getAttributeNames()) {
      if (!ALLOWED_ATTRIBUTES.has(name)) el.removeAttribute(name);
    }
    el.setAttribute("class", WATERMARK_LAYER_CLASS);
    el.setAttribute("aria-hidden", "true");
    el.removeAttribute("style");
    for (const [key, value] of Object.entries(options.style)) el.style.setProperty(key, value);
  }

  function check(): void {
    if (!root || !layer || !observer) return;
    let tampered = false;
    if (layer.parentNode !== root) {
      root.appendChild(layer);
      tampered = true;
    }
    if (
      layer.getAttribute("class") !== WATERMARK_LAYER_CLASS ||
      layer.getAttribute("aria-hidden") !== "true" ||
      layer.getAttributeNames().some((name) => !ALLOWED_ATTRIBUTES.has(name)) ||
      !styleMatches(layer, options.style)
    ) {
      restore(layer);
      tampered = true;
    }
    // 自己写回去的那几笔也会进队列，丢掉，免得自己盯自己
    observer.takeRecords();
    if (tampered) store.set({ restores: store.get().restores + 1 });
  }

  function start(): void {
    if (!connected || !root || !layer || observer) return;
    if (typeof MutationObserver === "undefined") return;
    observer = new MutationObserver(check);
    observer.observe(root, { childList: true });
    observer.observe(layer, { attributes: true });
  }

  function stop(): void {
    observer?.disconnect();
    observer = undefined;
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    connect() {
      if (connected) return;
      connected = true;
      start();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      stop();
    },

    attach(el) {
      if (el === root) return;
      stop();
      root = el;
      start();
    },
    setLayer(el) {
      if (el === layer) return;
      stop();
      layer = el;
      start();
    },
  };
}
