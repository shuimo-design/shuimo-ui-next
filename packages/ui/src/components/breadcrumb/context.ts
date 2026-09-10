import type { InjectionKey, Ref } from "vue";

export interface BreadcrumbContext {
  /** 分隔符文字 */
  separator: Ref<string | undefined>;
  /** 父组件的 separator 插槽；没传返回 undefined */
  separatorSlot: () => (() => unknown) | undefined;
}

export const breadcrumbKey: InjectionKey<BreadcrumbContext> = Symbol("m-breadcrumb");
