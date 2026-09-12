import {
  getCurrentScope,
  onScopeDispose,
  ref,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { createDarkMode, DARK_MODE_STORAGE_KEY } from "@shuimo-design/core";

export { DARK_MODE_STORAGE_KEY };

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

/**
 * 深浅主题的 Vue 门面。读写 localStorage、问 matchMedia、改 html[data-theme]、
 * 整页墨迹擦过全在 core 的 createDarkMode 里（MDarkMode 和 React 那边用的是同一份），
 * 这里只把快照桥成一个 Ref，并把 options 的 ref / getter 摊平喂进去。
 *
 * MDarkMode 用它，使用方也可以直接用（比如放在自己的导航栏按钮上）。
 */
export function useDarkMode(options: UseDarkModeOptions = {}): DarkModeController {
  const read = () => ({
    storageKey: toValue(options.storageKey) ?? DARK_MODE_STORAGE_KEY,
    autoMode: toValue(options.autoMode) ?? false,
    transition: toValue(options.transition) ?? true,
  });

  const controller = createDarkMode(read());
  const isDark = ref(controller.getServerSnapshot().isDark);
  const stop = controller.subscribe(() => (isDark.value = controller.getSnapshot().isDark));
  watchEffect(() => controller.update(read()));

  if (getCurrentScope()) {
    onScopeDispose(() => {
      stop();
      controller.disconnect();
    });
  }

  return {
    isDark,
    // 组合式用法是手动起手的：这里直接调 init，不走 connect()（那条路留给组件壳的控制器胶水）
    init: (explicit) => controller.init(explicit),
    set: (dark) => controller.set(dark),
    toggle: async () => {
      await controller.toggle();
    },
  };
}
