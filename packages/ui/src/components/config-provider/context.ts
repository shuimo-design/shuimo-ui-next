// 按约定 key 放在组件目录；真正的定义在 internal/config.ts，因为别的组件是从 internal 读配置的
export { configKey, DEFAULT_CONFIG, useConfig, type ConfigContext } from "../../internal/config";
