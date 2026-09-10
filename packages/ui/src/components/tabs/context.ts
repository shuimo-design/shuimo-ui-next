import type { InjectionKey } from "vue";
import type { TabName } from "./types";

/** pane 向 MTabs 登记的信息：都是取值函数，MTabs 在自己的模板里读时才会建立依赖 */
export interface TabPaneRegistration {
  /** useId 生成，导航项和面板的 id 都从它派生 */
  uid: string;
  name: () => TabName;
  label: () => string | undefined;
  labelSlot: () => (() => unknown) | undefined;
  disabled: () => boolean;
  /** undefined 表示没传，跟随 MTabs 的 closable */
  closable: () => boolean | undefined;
  /** 面板根元素，用来按 DOM 顺序排导航项（v-for 中途插入的 pane 登记顺序和位置不一致） */
  el: () => HTMLElement | null;
}

export interface TabsContext {
  register: (pane: TabPaneRegistration) => void;
  unregister: (uid: string) => void;
  /** 面板挂载后调一次，让导航按 DOM 顺序重排 */
  reorder: () => void;
  isActive: (name: TabName) => boolean;
}

export const tabsKey: InjectionKey<TabsContext> = Symbol("m-tabs");

export function tabElementId(uid: string): string {
  return `${uid}-tab`;
}

export function paneElementId(uid: string): string {
  return `${uid}-pane`;
}
