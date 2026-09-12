/**
 * 深浅主题开关的无框架部分。
 *
 * 这个组件所有的"脏活"都在这里：读 localStorage、问 matchMedia、监听系统偏好、
 * 改 html 的 data-theme、整页墨迹擦过。两个壳里一个都不许出现——
 * 不只是为了过机检：这些东西在服务端全都不存在，留在壳里就等于每个框架各写一遍降级分支。
 *
 * 服务端快照恒定是「没读过 localStorage」的那个状态（isDark: false），
 * 客户端首帧也渲染这一版，connect() 之后才换成真实主题，水合才不会对不上。
 */
import { startInkViewTransition } from "../../ink/transition";
import { createStore } from "../../runtime/store";
import { sanitizeId } from "../../runtime/id";
import type { Controller } from "../../runtime/controller";
import { TAIJI_FINS_DARK, TAIJI_FINS_LIGHT, TAIJI_FISH, TAIJI_HIDDEN } from "./paths";

export { TAIJI_FINS_DARK, TAIJI_FINS_LIGHT, TAIJI_FISH, TAIJI_HIDDEN } from "./paths";
export type { DarkModeEmits, DarkModeProps } from "./types";

/** 记住深浅选择的 localStorage 键；值只有 "dark" / "light" 两种 */
export const DARK_MODE_STORAGE_KEY = "shuimo-theme";

/* ── 纯派生 ──────────────────────────────────────────────────── */

export function darkModeClasses(o: {
  isDark: boolean;
  rotate: boolean;
  disabled: boolean;
}): string[] {
  return [
    "m-dark-mode",
    ...(o.isDark ? ["m-dark-mode--dark"] : []),
    ...(o.rotate ? ["m-dark-mode--rotate"] : []),
    ...(o.disabled ? ["m-dark-mode--disabled"] : []),
  ];
}

export function darkModeLabel(isDark: boolean): string {
  return isDark ? "切换到亮色" : "切换到深色";
}

/**
 * 路径同时给 d 属性（Safari 不认 CSS d，靠属性兜底）和 CSS 变量
 * （Chromium / Firefox 用 transition 对 d 插值）。
 */
export function darkModePathVars(): Record<string, string> {
  return {
    "--m-dark-mode-path-hidden": `path("${TAIJI_HIDDEN}")`,
    "--m-dark-mode-path-fish": `path("${TAIJI_FISH}")`,
    "--m-dark-mode-path-fins-light": `path("${TAIJI_FINS_LIGHT}")`,
    "--m-dark-mode-path-fins-dark": `path("${TAIJI_FINS_DARK}")`,
  };
}

/** 同页多个实例时 SVG 滤镜 id 不能撞；React 的 useId 带非法字符，统一洗一遍 */
export function darkModeGlowId(uid: string): string {
  return `${sanitizeId(uid)}-glow`;
}

export interface DarkModeFish {
  /** 墨鱼：亮色收着，转暗摆尾 */
  yin: { d: string; filter?: string };
  /** 白鱼：转 180° 与墨鱼咬合，姿势和墨鱼相反 */
  yang: { d: string; filter?: string };
  /** 鱼鳍：亮色贴在白鱼头部，转暗挪到墨鱼腹部 */
  fins: { d: string };
}

/** 两条鱼当前该摆什么姿势、谁带着那圈光晕 */
export function darkModeFish(isDark: boolean, glowId: string): DarkModeFish {
  const glow = `url(#${glowId})`;
  return {
    yin: { d: isDark ? TAIJI_FISH : TAIJI_HIDDEN, filter: isDark ? glow : undefined },
    yang: { d: isDark ? TAIJI_HIDDEN : TAIJI_FISH, filter: isDark ? undefined : glow },
    fins: { d: isDark ? TAIJI_FINS_DARK : TAIJI_FINS_LIGHT },
  };
}

/* ── 控制器 ──────────────────────────────────────────────────── */

const MEDIA = "(prefers-color-scheme: dark)";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.(MEDIA).matches === true;
}

function readStored(key: string | false): boolean | undefined {
  if (key === false || typeof localStorage === "undefined") return undefined;
  try {
    const value = localStorage.getItem(key);
    return value === "dark" ? true : value === "light" ? false : undefined;
  } catch {
    // 隐私模式 / 禁用存储时读会抛，当没记录处理
    return undefined;
  }
}

function writeStored(key: string | false, dark: boolean): void {
  if (key === false || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, dark ? "dark" : "light");
  } catch {
    // 写不进去就不记，不影响切换本身
  }
}

export interface DarkModeOptions {
  /** localStorage 键，false 不记 */
  storageKey: string | false;
  /** 没有记录时是否跟随系统（写 data-theme="system"） */
  autoMode: boolean;
  /** 切换时是否做整页墨迹擦过 */
  transition: boolean;
  /**
   * 使用方显式绑定的值；undefined 表示没绑，
   * 初始状态要按 本地记录 → 系统偏好 → 页面现状 的顺序推。connect() 时读一次。
   */
  value?: boolean;
}

export interface DarkModeSnapshot {
  /** 当前页面是否深色（跟随系统时随系统偏好变） */
  readonly isDark: boolean;
}

export interface DarkModeController extends Controller<DarkModeSnapshot, DarkModeOptions> {
  /**
   * 按 显式值 → 本地记录 → 系统偏好 → 页面现状 的顺序初始化并写到 html 上；只在浏览器里做。
   * connect() 会用当前的 options.value 调一次，使用方一般不用自己调。
   */
  init(explicit?: boolean): void;
  /** 显式设为深 / 浅：写 html[data-theme]、写 localStorage，并停止跟随系统 */
  set(dark: boolean): Promise<void>;
  /** 反转，返回切换后的深浅 */
  toggle(): Promise<boolean>;
}

/** 引用恒定：useSyncExternalStore 每次拿到新对象就会无限重渲染 */
const SERVER_SNAPSHOT: DarkModeSnapshot = { isDark: false };

/**
 * 深浅主题的核心逻辑。只改 html 的 data-theme 属性和 localStorage，不碰别的 DOM。
 */
export function createDarkMode(initial: DarkModeOptions): DarkModeController {
  const store = createStore<DarkModeSnapshot>(SERVER_SNAPSHOT);
  let options = initial;
  let media: MediaQueryList | undefined;
  let connected = false;

  const storageKey = () => options.storageKey ?? DARK_MODE_STORAGE_KEY;

  const onMediaChange = (event: MediaQueryListEvent) => {
    store.set({ isDark: event.matches });
  };

  function stopFollowing(): void {
    media?.removeEventListener("change", onMediaChange);
    media = undefined;
  }

  // 跟随系统：html 上写 system 让 tokens.css 走 prefers-color-scheme，自己只负责把状态读出来
  function followSystem(): void {
    document.documentElement.dataset.theme = "system";
    media = window.matchMedia(MEDIA);
    media.addEventListener("change", onMediaChange);
    store.set({ isDark: media.matches });
  }

  function apply(dark: boolean): void {
    stopFollowing();
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    store.set({ isDark: dark });
    writeStored(storageKey(), dark);
  }

  function init(explicit?: boolean): void {
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
    if (options.autoMode) {
      followSystem();
      return;
    }
    // 什么都没有：不动 html，只把现状读出来
    const current = document.documentElement.dataset.theme;
    store.set({ isDark: current === "dark" || (current === "system" && systemPrefersDark()) });
  }

  async function set(dark: boolean): Promise<void> {
    if (typeof document === "undefined") return;
    if (options.transition) {
      await startInkViewTransition(() => apply(dark));
    } else {
      apply(dark);
    }
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
      init(options.value);
    },
    disconnect() {
      // 不写 if (!connected) return：组合式用法不走 connect()，照样要把系统偏好的监听撤掉
      connected = false;
      stopFollowing();
    },

    init,
    set,
    async toggle() {
      const next = !store.get().isDark;
      await set(next);
      return next;
    },
  };
}
