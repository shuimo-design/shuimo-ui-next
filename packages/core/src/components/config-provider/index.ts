/**
 * 全局配置容器的无框架部分。配置本身的形状、默认值和合并规则在 context/config.ts，
 * 这里只剩唯一一件带副作用的事：把主题写到 html 的 data-theme 上。
 *
 * 这件事必须在 core：两个壳里都不许出现 `document.`（机检会拦），
 * 而且服务端没有 document，得由这一层统一挡掉。
 */
import { isClient } from "../../runtime/dom";
import type { ConfigTheme } from "./types";

export type { ConfigProviderProps, ConfigSize, ConfigTheme } from "./types";

/**
 * 主题落到 html[data-theme] 上（tokens.css 只认这个属性）。
 * 不传 theme 就完全不碰，留给 MDarkMode 或使用方自己写；
 * 服务端直接跳过，由客户端挂载后补做。
 */
export function applyConfigTheme(theme: ConfigTheme | undefined): void {
  if (theme === undefined || !isClient()) return;
  document.documentElement.dataset.theme = theme;
}
