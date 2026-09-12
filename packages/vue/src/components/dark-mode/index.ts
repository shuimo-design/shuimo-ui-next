export { default as MDarkMode } from "./MDarkMode.vue";
export {
  DARK_MODE_STORAGE_KEY,
  useDarkMode,
  type DarkModeController,
  type UseDarkModeOptions,
} from "./use-dark-mode";
// props / emits 的类型在 core，两个框架共用同一份
export type { DarkModeEmits, DarkModeProps } from "@shuimo-design/core";
