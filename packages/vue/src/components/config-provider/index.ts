export { default as MConfigProvider } from "./MConfigProvider.vue";
export { configKey, useConfig } from "./context";
// 类型和默认值在 core，两个框架共用同一份；这里转出去，使用方不用再多装一个包
export type {
  ConfigContext,
  ConfigProviderProps,
  ConfigProviderSlots,
  ConfigSize,
  ConfigTheme,
} from "@shuimo-design/core";
