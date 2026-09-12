import { createContext, useContext } from "react";
import { DEFAULT_CONFIG, type ConfigContext } from "@shuimo-design/core";

/**
 * 全局配置的上下文。形状、默认值和合并规则都在 core（`context/config.ts`），
 * 这里只剩 React 的那层包装 —— 和 Vue 的 InjectionKey + useConfig 是同一件事的两种写法。
 *
 * 这一个的默认值不是 undefined 而是 DEFAULT_CONFIG：没人套 MConfigProvider 时组件也要有配置可读，
 * 而且它的引用恒定，服务端和客户端拿到的是同一个对象。
 */
export const ConfigProviderContext = createContext<ConfigContext>(DEFAULT_CONFIG);

/** 读最近一层 MConfigProvider 合并后的配置；没有 provider 时返回默认值 */
export function useConfig(): ConfigContext {
  return useContext(ConfigProviderContext);
}
