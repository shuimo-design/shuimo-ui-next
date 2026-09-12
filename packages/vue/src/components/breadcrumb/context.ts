import type { ComputedRef, InjectionKey } from "vue";
import type { BreadcrumbContextValue } from "@shuimo-design/core";

export interface BreadcrumbVueContext {
  /** core 定的纯值形状（目前只有 separator 文字），外面包一层 computed 好让子项跟着变 */
  readonly value: ComputedRef<BreadcrumbContextValue>;
  /**
   * 父组件的 separator 插槽。插槽是框架概念，core 的形状里没有它。
   * 写成取值函数而不是直接放进 computed：slots 不是深响应式的，
   * 每次都得现读，才拿得到父组件这一轮渲染传下来的那个插槽。
   */
  readonly separatorSlot: () => (() => unknown) | undefined;
}

export const breadcrumbKey: InjectionKey<BreadcrumbVueContext> = Symbol("m-breadcrumb");
