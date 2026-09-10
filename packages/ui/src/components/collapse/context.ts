import type { InjectionKey, Ref } from "vue";
import type { CollapseName } from "./types";

export interface CollapseContext {
  isActive: (name: CollapseName) => boolean;
  toggle: (name: CollapseName) => void;
  divider: Ref<boolean>;
  disabled: Ref<boolean>;
}

export const collapseKey: InjectionKey<CollapseContext> = Symbol("m-collapse");
