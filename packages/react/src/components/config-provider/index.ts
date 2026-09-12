export { MConfigProvider, type MConfigProviderProps } from "./MConfigProvider";
export { ConfigProviderContext, useConfig } from "./context";
// 类型和默认值在 core，两个框架共用同一份
export {
  DEFAULT_CONFIG,
  type ConfigContext,
  type ConfigProviderProps,
  type ConfigSize,
  type ConfigTheme,
} from "@shuimo-design/core";
