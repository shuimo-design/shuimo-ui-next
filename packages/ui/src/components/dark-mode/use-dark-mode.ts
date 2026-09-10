import {
  getCurrentScope,
  onScopeDispose,
  ref,
  toValue,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { startInkViewTransition } from "../../ink/transition";

/** 记住深浅选择的 localStorage 键；值只有 "dark" / "light" 两种 */
export const DARK_MODE_STORAGE_KEY = "shuimo-theme";

export interface UseDarkModeOptions {
  /** localStorage 键，false 不记 */
  storageKey?: MaybeRefOrGetter<string | false>;
  /** 没有记录时是否跟随系统（写 data-theme="system"）。默认 false：库的主题默认是亮色纸，不替使用方决定跟随系统 */
  autoMode?: MaybeRefOrGetter<boolean>;
  /** 切换时是否做整页墨迹擦过 */
  transition?: MaybeRefOrGetter<boolean>;
}

export interface DarkModeController {
  /** 当前页面是否深色（跟随系统时随系统偏好变） */
  isDark: Ref<boolean>;
  /** 按 显式值 → 本地记录 → 系统偏好 的顺序初始化并写到 html 上；只在浏览器里做 */
  init: (explicit?: boolean) => void;
  /** 显式设为深 / 浅：写 html[data-theme]、写 localStorage，并停止跟随系统 */
  set: (dark: boolean) => Promise<void>;
  toggle: () => Promise<void>;
}

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

/**
 * 深浅主题的核心逻辑，MDarkMode 用它，使用方也可以直接用（比如放在自己的导航栏按钮上）。
 * 只改 html 的 data-theme 属性和 localStorage，不碰别的 DOM。
 */
export function useDarkMode(options: UseDarkModeOptions = {}): DarkModeController {
  const isDark = ref(false);
  let media: MediaQueryList | undefined;

  const onMediaChange = (event: MediaQueryListEvent) => {
    isDark.value = event.matches;
  };

  function stopFollowing() {
    media?.removeEventListener("change", onMediaChange);
    media = undefined;
  }

  // 跟随系统：html 上写 system 让 tokens.css 走 prefers-color-scheme，自己只负责把状态读出来
  function followSystem() {
    document.documentElement.dataset.theme = "system";
    media = window.matchMedia(MEDIA);
    media.addEventListener("change", onMediaChange);
    isDark.value = media.matches;
  }

  function apply(dark: boolean) {
    stopFollowing();
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    isDark.value = dark;
    writeStored(toValue(options.storageKey) ?? DARK_MODE_STORAGE_KEY, dark);
  }

  function init(explicit?: boolean) {
    if (typeof document === "undefined") return;
    if (explicit !== undefined) {
      apply(explicit);
      return;
    }
    const stored = readStored(toValue(options.storageKey) ?? DARK_MODE_STORAGE_KEY);
    if (stored !== undefined) {
      apply(stored);
      return;
    }
    if (toValue(options.autoMode) ?? false) {
      followSystem();
      return;
    }
    // 什么都没有：不动 html，只把现状读出来
    const current = document.documentElement.dataset.theme;
    isDark.value = current === "dark" || (current === "system" && systemPrefersDark());
  }

  async function set(dark: boolean) {
    if (typeof document === "undefined") return;
    if (toValue(options.transition) ?? true) {
      await startInkViewTransition(() => apply(dark));
    } else {
      apply(dark);
    }
  }

  if (getCurrentScope()) onScopeDispose(stopFollowing);

  return { isDark, init, set, toggle: () => set(!isDark.value) };
}
