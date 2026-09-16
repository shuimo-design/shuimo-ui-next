/**
 * 宣纸主题的无框架部分。
 *
 * "纸面"由 tokens.css 里的三个变量决定：`--m-paper-rgb`（MRicePaper、输入框底色、边框遮罩都读它）、
 * `--m-paper` 和 `--m-bg`（页面和面板的底色）。切纸就是把这三个变量按预设重写到 `<html>` 上，
 * 再加一张按同一底色生成的纹理（`--m-paper-theme-texture`）；写哪几个变量只在这一个文件里定，
 * MRicePaper 那边不另存一份。
 *
 * 深色主题下 tokens.css 给的是深色纸（21 29 41），亮色的预设压上去会把整页打亮，
 * 所以深色时只记 `data-paper`、不写变量；转回亮色时再把变量补上。
 * 读 localStorage、盯 data-theme 和系统偏好这些活全在下面的控制器里，两个壳一个 document. 都没有。
 */
import { inkBlobUrl } from "../../ink/assets/blob";
import { PAPER_PRESETS, paperTextureUrl, type PaperPreset } from "../../ink/paper";
import type { Controller } from "../../runtime/controller";
import { createStore } from "../../runtime/store";
import type { PaperThemeProps, PaperThemeSize } from "./types";

export type { PaperPreset, PaperThemeEmits, PaperThemeProps, PaperThemeSize } from "./types";

/** 记住选纸的 localStorage 键；值是 PaperPreset 之一 */
export const PAPER_THEME_STORAGE_KEY = "shuimo-paper";

/** 五种纸的默认顺序：由生到熟、由白到黄，月白单独放最后 */
export const PAPER_PRESET_ORDER: readonly PaperPreset[] = [
  "raw",
  "processed",
  "antique",
  "teaStained",
  "moonWhite",
];

/** 默认中文名 */
export const PAPER_PRESET_LABELS: Record<PaperPreset, string> = {
  raw: "生宣",
  processed: "熟宣",
  antique: "古色",
  teaStained: "茶染",
  moonWhite: "月白",
};

/** 切纸时写到 <html> 上的变量；清纸 / 转深色时按这张表逐个移除 */
const PAPER_VARS = ["--m-paper-rgb", "--m-paper", "--m-bg", "--m-paper-theme-texture"] as const;

/* ── 纯派生 ──────────────────────────────────────────────────── */

export function isPaperPreset(value: unknown): value is PaperPreset {
  return typeof value === "string" && Object.hasOwn(PAPER_PRESETS, value);
}

/** 一种纸对应的全部纸面变量 */
export function paperThemeVars(preset: PaperPreset): Record<string, string> {
  const rgb = PAPER_PRESETS[preset];
  const triplet = rgb.join(" ");
  return {
    "--m-paper-rgb": triplet,
    "--m-paper": `rgb(${triplet})`,
    "--m-bg": `rgb(${triplet})`,
    "--m-paper-theme-texture": `url("${paperTextureUrl({ baseColor: rgb })}")`,
  };
}

export function paperThemeClasses(o: { size: PaperThemeSize; disabled: boolean }): string[] {
  return [
    "m-paper-theme",
    `m-paper-theme--${o.size}`,
    ...(o.disabled ? ["m-paper-theme--disabled"] : []),
  ];
}

export interface PaperThemeSwatch {
  preset: PaperPreset;
  label: string;
  checked: boolean;
  /** roving tabindex：选中的那一个进 Tab 序，没选中时第一个进 */
  tabIndex: 0 | -1;
  className: string;
  style: Record<string, string>;
}

/**
 * 一排纸样。纸色和一小块纹理内联在每个纸样上（64px 的单元、不带纤维，一两 KB），
 * 毛边遮罩每个纸样各一张、种子按位置错开，一排里不会两块长得一样。
 * 只依赖 props，服务端和客户端首帧算出来的一样。
 */
export function paperThemeSwatches(o: {
  presets: readonly PaperPreset[];
  labels?: Partial<Record<PaperPreset, string>>;
  preset: PaperPreset | undefined;
}): PaperThemeSwatch[] {
  const list = o.presets.filter(isPaperPreset);
  const hasChecked = o.preset !== undefined && list.includes(o.preset);
  return list.map((preset, index) => {
    const checked = preset === o.preset;
    const rgb = PAPER_PRESETS[preset];
    return {
      preset,
      label: o.labels?.[preset] ?? PAPER_PRESET_LABELS[preset],
      checked,
      tabIndex: checked || (!hasChecked && index === 0) ? 0 : -1,
      className: [
        "m-paper-theme__swatch",
        `m-paper-theme__swatch--${preset}`,
        ...(checked ? ["m-paper-theme__swatch--checked"] : []),
      ].join(" "),
      style: {
        "--m-paper-theme-swatch-rgb": rgb.join(" "),
        "--m-paper-theme-swatch-texture": `url("${paperTextureUrl({
          baseColor: rgb,
          size: 64,
          fibers: 0,
          particles: 0,
        })}")`,
        "--m-paper-theme-swatch-mask": `url("${inkBlobUrl({
          seed: index + 3,
          size: 64,
          raggedness: 0.07,
          radius: 0.46,
        })}")`,
      },
    };
  });
}

/**
 * 方向键 / Home / End 要跳到第几个纸样（两头循环）。
 * 返回 presets 里的下标；这个键不归我们管时返回 undefined，壳据此决定要不要 preventDefault。
 */
export function paperThemeNextIndex(
  count: number,
  o: { key: string; from: number },
): number | undefined {
  if (count <= 0) return undefined;
  const current = Math.max(0, o.from);
  switch (o.key) {
    case "ArrowLeft":
    case "ArrowUp":
      return (current - 1 + count) % count;
    case "ArrowRight":
    case "ArrowDown":
      return (current + 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return undefined;
  }
}

/** 事件目标落在第几个纸样上；不在任何纸样里返回 -1 */
export function focusedPaperSwatchIndex(
  root: HTMLElement | null,
  target: EventTarget | null,
): number {
  if (!root || !(target instanceof Element)) return -1;
  const swatch = target.closest<HTMLElement>('[role="radio"]');
  if (!swatch) return -1;
  return [...root.querySelectorAll<HTMLElement>('[role="radio"]')].indexOf(swatch);
}

export function focusPaperSwatch(root: HTMLElement | null, index: number): void {
  root?.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus();
}

/* ── 写到 <html> 上 ──────────────────────────────────────────── */

const MEDIA = "(prefers-color-scheme: dark)";

/** 这个根元素当前是不是深色：data-theme="dark"，或 "system" 且系统偏好深色 */
export function paperRootIsDark(root: HTMLElement): boolean {
  const theme = root.dataset.theme;
  if (theme === "dark") return true;
  return (
    theme === "system" &&
    typeof window !== "undefined" &&
    window.matchMedia?.(MEDIA).matches === true
  );
}

/** 根元素上当前记着的纸；没记或认不出返回 undefined */
export function readPaperPreset(root: HTMLElement): PaperPreset | undefined {
  const value = root.dataset.paper;
  return isPaperPreset(value) ? value : undefined;
}

/**
 * 按 data-paper 和当前深浅重写纸面变量：亮色写预设的值，深色（或没记纸）把变量全部移除，
 * 让 tokens.css 的值重新生效。data-theme 变了以后调一次。
 */
export function syncPaperVars(root: HTMLElement): void {
  const preset = readPaperPreset(root);
  if (!preset || paperRootIsDark(root)) {
    for (const name of PAPER_VARS) root.style.removeProperty(name);
    return;
  }
  for (const [name, value] of Object.entries(paperThemeVars(preset))) {
    root.style.setProperty(name, value);
  }
}

/**
 * 一键切纸：往根元素写 `data-paper="<preset>"` 和纸面变量。
 * 不用组件也能调（比如在应用入口按用户配置切一次）；只在浏览器里有意义，没有 document 时什么都不做。
 */
export function applyPaperPreset(
  preset: PaperPreset,
  root: HTMLElement | undefined = typeof document === "undefined"
    ? undefined
    : document.documentElement,
): void {
  if (!root) return;
  root.dataset.paper = preset;
  syncPaperVars(root);
}

/** 撤掉切纸：删 data-paper、移除全部纸面变量，回到 tokens.css 的默认纸 */
export function clearPaperPreset(
  root: HTMLElement | undefined = typeof document === "undefined"
    ? undefined
    : document.documentElement,
): void {
  if (!root) return;
  delete root.dataset.paper;
  syncPaperVars(root);
}

/* ── 控制器 ──────────────────────────────────────────────────── */

function readStored(key: string | false): PaperPreset | undefined {
  if (key === false || typeof localStorage === "undefined") return undefined;
  try {
    const value = localStorage.getItem(key);
    return isPaperPreset(value) ? value : undefined;
  } catch {
    // 隐私模式 / 禁用存储时读会抛，当没记录处理
    return undefined;
  }
}

function writeStored(key: string | false, preset: PaperPreset): void {
  if (key === false || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, preset);
  } catch {
    // 写不进去就不记，不影响切换本身
  }
}

export interface PaperThemeOptions {
  /** 记到 localStorage（键 PAPER_THEME_STORAGE_KEY）；false 不记 */
  storage: boolean;
  /**
   * 使用方显式绑定的值；undefined 表示没绑，
   * 初始状态要按 本地记录 → 页面现状 的顺序推。connect() 时读一次。
   */
  value?: PaperPreset;
}

export interface PaperThemeSnapshot {
  /** 当前页面用的纸；没切过时是 undefined（tokens.css 的默认纸） */
  readonly preset: PaperPreset | undefined;
}

export interface PaperThemeController extends Controller<PaperThemeSnapshot, PaperThemeOptions> {
  /**
   * 按 显式值 → 本地记录 → 页面现状 的顺序初始化并写到 html 上；只在浏览器里做。
   * connect() 会用当前的 options.value 调一次，使用方一般不用自己调。
   */
  init(explicit?: PaperPreset): void;
  /** 切到某种纸：写 html[data-paper] 和纸面变量、写 localStorage */
  set(preset: PaperPreset): void;
}

/** 引用恒定：useSyncExternalStore 每次拿到新对象就会无限重渲染 */
const SERVER_SNAPSHOT: PaperThemeSnapshot = { preset: undefined };

/**
 * 切纸的核心逻辑。只改 html 的 data-paper 属性、html 上的几个内联变量和 localStorage。
 * 同页多个实例改的是同一个 html，盯着 data-paper 的变化就能互相同步。
 */
export function createPaperTheme(initial: PaperThemeOptions): PaperThemeController {
  const store = createStore<PaperThemeSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let connected = false;
  let observer: MutationObserver | undefined;
  let media: MediaQueryList | undefined;

  const root = () => document.documentElement;
  const storageKey = () => (options.storage ? PAPER_THEME_STORAGE_KEY : false);

  function apply(preset: PaperPreset): void {
    applyPaperPreset(preset, root());
    store.set({ preset });
    writeStored(storageKey(), preset);
  }

  function init(explicit?: PaperPreset): void {
    if (typeof document === "undefined") return;
    if (explicit !== undefined) {
      apply(explicit);
      return;
    }
    const stored = readStored(storageKey());
    if (stored !== undefined) {
      apply(stored);
      return;
    }
    // 什么都没有：不动 html，只把现状读出来（可能是别的实例或 applyPaperPreset 写的）
    store.set({ preset: readPaperPreset(root()) });
  }

  /** html 的属性变了：data-paper 变了同步快照，data-theme 变了按新的深浅重写变量 */
  function onMutation(records: MutationRecord[]): void {
    for (const record of records) {
      if (record.attributeName === "data-paper") store.set({ preset: readPaperPreset(root()) });
      if (record.attributeName === "data-theme") syncPaperVars(root());
    }
  }

  const onMediaChange = () => syncPaperVars(root());

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
      init(options.value);
      observer = new MutationObserver(onMutation);
      observer.observe(root(), { attributes: true, attributeFilter: ["data-paper", "data-theme"] });
      // 只有 data-theme="system" 时深浅才随系统变，其它情况这个监听不会触发有意义的重写
      media = window.matchMedia(MEDIA);
      media.addEventListener("change", onMediaChange);
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      observer?.disconnect();
      observer = undefined;
      media?.removeEventListener("change", onMediaChange);
      media = undefined;
    },

    init,
    set(preset) {
      if (typeof document === "undefined") return;
      apply(preset);
    },
  };
}

/** 没传 presets 时用全部五种 */
export function paperThemePresets(presets: PaperThemeProps["presets"]): readonly PaperPreset[] {
  return presets ?? PAPER_PRESET_ORDER;
}
