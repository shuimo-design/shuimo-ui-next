import { computed, inject, type ComputedRef, type InjectionKey } from "vue";
import { DEFAULT_CONFIG, type ConfigContext } from "@shuimo-design/core";

/**
 * 全局配置的形状、默认值和合并规则都在 core（`context/config.ts`），这里只剩 Vue 的注入钥匙
 * 和读它的组合式函数。定义放在 internal 而不是组件目录，因为别的组件也从这里读配置。
 */
export const configKey: InjectionKey<ComputedRef<ConfigContext>> = Symbol("m-config");

// 没有 MConfigProvider 时所有组件共用这一份默认值，不必每个实例各建一个 computed
const fallback = computed<ConfigContext>(() => DEFAULT_CONFIG);

/** 读最近一层 MConfigProvider 合并后的配置；没有 provider 时返回默认值 */
export function useConfig(): ComputedRef<ConfigContext> {
  return inject(configKey, fallback);
}
