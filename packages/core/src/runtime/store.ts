/**
 * 跨框架的极小状态容器：不可变快照 + 订阅。
 * Vue 用 shallowRef 桥接，React 用 useSyncExternalStore 桥接，两边共用同一份状态机。
 */

export type Listener = () => void;
export type Unsubscribe = () => void;

export interface Store<S extends object> {
  /** 客户端快照。内容变了才换引用，没变就返回同一个对象 */
  get(): S;
  /**
   * 服务端渲染（以及水合首帧）用的快照。
   * 引用必须恒定：React 的 useSyncExternalStore 每次拿到新对象就会无限重渲染，
   * 所以它返回创建时那一份初值，永远不参与 set()。
   */
  getServer(): S;
  subscribe(listener: Listener): Unsubscribe;
  /** 浅比较，没变就不通知；返回是否真的变了 */
  set(patch: Partial<S>): boolean;
}

export function createStore<S extends object>(initial: S): Store<S> {
  const server: S = initial;
  let snapshot: S = initial;
  const listeners = new Set<Listener>();

  return {
    get: () => snapshot,
    getServer: () => server,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(patch) {
      let changed = false;
      for (const key in patch) {
        if (!Object.is(snapshot[key as keyof S], patch[key as keyof S])) {
          changed = true;
          break;
        }
      }
      if (!changed) return false;
      snapshot = { ...snapshot, ...patch };
      // 先复制一份再遍历：监听器里退订不会漏掉后面的
      // oxlint-disable-next-line unicorn/no-useless-spread -- 先复制再遍历：回调里退订不能漏掉后面的
      for (const listener of [...listeners]) listener();
      return true;
    },
  };
}
