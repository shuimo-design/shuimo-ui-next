import { createContext } from "react";
import type { ListContextValue } from "@shuimo-design/core";

/**
 * 上下文的形状（字段都是纯值）在 core，这里只管 React 这一侧的容器。
 * 默认 undefined 而不是 LIST_CONTEXT_DEFAULT：单独用 MListItem（外面没有 MList）时要能认出来，
 * 落回默认值的事交给 core 的 resolveListMarker 做，两个壳才是同一套规则。
 */
export const ListContext = createContext<ListContextValue | undefined>(undefined);
