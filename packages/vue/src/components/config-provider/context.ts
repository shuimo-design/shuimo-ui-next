// 按约定 key 放在组件目录；真正的定义在 internal/config.ts，因为别的组件是从 internal 读配置的
export { configKey, useConfig } from "../../internal/config";
// 配置的形状和默认值都在 core，两个框架共用同一份
export { DEFAULT_CONFIG, type ConfigContext } from "@shuimo-design/core";
