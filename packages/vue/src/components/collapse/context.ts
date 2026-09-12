import type { ComputedRef, InjectionKey } from "vue";
import type { CollapseContextValue } from "@shuimo-design/core";

/**
 * 上下文的形状和展开项的增删规则都在 core（`context/collapse.ts`），这里只剩 Vue 的注入钥匙。
 * 装的是一个 computed：展开项、divider、禁用态变了，读它的子项自然重渲染。
 */
export const collapseKey: InjectionKey<ComputedRef<CollapseContextValue>> = Symbol("m-collapse");
