import type { InjectionKey, Ref } from "vue";

export interface ListContext {
  marker: Ref<boolean>;
}

export const listKey: InjectionKey<ListContext> = Symbol("m-list");
