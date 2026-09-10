import type { InkTier } from "../../ink/tier";

export type ConfigSize = "sm" | "md" | "lg";
/** 与 tokens.css 的 data-theme 取值一致：light 亮纸、dark 暗纸、system 跟随系统 */
export type ConfigTheme = "light" | "dark" | "system";

export interface ConfigProviderProps {
  /** 组件默认尺寸，组件自己没传 size 时用它 */
  size?: ConfigSize;
  /** 语言标签（BCP 47，如 zh-CN / en-US），组件内置文案按它选 */
  locale?: string;
  /** 水墨效果档位 0 / 1 / 2；不传跟随 createInkEngine 的自动探测 */
  inkTier?: InkTier;
  /** 主题：挂载后写到 html 的 data-theme；不传则不接管，交给 MDarkMode 或使用方自己写 */
  theme?: ConfigTheme;
}

export interface ConfigProviderSlots {
  default?: () => unknown;
}
