import { computed, inject, type ComputedRef, type InjectionKey } from "vue";
import type { ConfigSize, ConfigTheme } from "../components/config-provider/types";
import type { InkTier } from "../ink/tier";

/** 全局配置的解析结果；MConfigProvider 注入，组件用 useConfig() 读 */
export interface ConfigContext {
  size: ConfigSize;
  locale: string;
  /** undefined = 跟随 ink 引擎自动探测 */
  inkTier?: InkTier;
  /** undefined = 没人接管 html 的 data-theme */
  theme?: ConfigTheme;
}

export const DEFAULT_CONFIG: ConfigContext = { size: "md", locale: "zh-CN" };

export const configKey: InjectionKey<ComputedRef<ConfigContext>> = Symbol("m-config");

// 没有 MConfigProvider 时所有组件共用这一份默认值，不必每个实例各建一个 computed
const fallback = computed<ConfigContext>(() => DEFAULT_CONFIG);

/** 读最近一层 MConfigProvider 合并后的配置；没有 provider 时返回默认值 */
export function useConfig(): ComputedRef<ConfigContext> {
  return inject(configKey, fallback);
}
