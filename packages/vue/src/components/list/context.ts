import type { ComputedRef, InjectionKey } from "vue";
import type { ListContextValue } from "@shuimo-design/core";

/**
 * 上下文的形状（字段都是纯值）在 core，这里只管 Vue 这一侧的容器。
 * 纯值外面包一层 computed：MList 的 props 变了，子项读到的才是新值。
 * 注入不到（单独用 MListItem）时是 undefined，core 的 resolveListMarker 会落回默认值。
 */
export const listKey: InjectionKey<ComputedRef<ListContextValue>> = Symbol("m-list");
