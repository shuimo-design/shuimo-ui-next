/**
 * 子组件向父组件登记自己的通用表。
 *
 * 为什么要重写：原来的登记记录把每个字段写成取值函数（`name: () => TabName`），
 * 那是 Vue 响应式的产物 —— 父组件在自己的模板里读时才建立依赖。
 * React 里 getter 不会触发重渲染，直接搬过去会静默失效。
 * 所以这里改成**不可变的纯数据 + 显式 update**：内容变了就换一个新数组，
 * 两个框架各自订阅、各自重渲染。
 *
 * 顺序也不再靠 `compareDocumentPosition` 比较隐藏占位元素 ——
 * React 的 effect 执行顺序在 Fragment / Suspense / 并发切片下不保证和 DOM 顺序一致，
 * 服务端更是压根没有 DOM。要顺序就显式给 `order`，或者由父组件从 children 里按序收集。
 */
import { createStore } from "../runtime/store";
import type { Unsubscribe } from "../runtime/store";

export interface RegistryRecord {
  readonly uid: string;
  /** 显式的排序位；不给就按登记先后 */
  readonly order?: number;
}

export interface RegistrySnapshot<T extends RegistryRecord> {
  readonly items: readonly T[];
}

export interface Registry<T extends RegistryRecord> {
  register(item: T): void;
  /** 子组件的 props 变了自己调，父组件收到通知重渲染 */
  update(uid: string, patch: Partial<Omit<T, "uid">>): void;
  unregister(uid: string): void;
  getSnapshot(): RegistrySnapshot<T>;
  getServerSnapshot(): RegistrySnapshot<T>;
  subscribe(listener: () => void): Unsubscribe;
}

export function createRegistry<T extends RegistryRecord>(): Registry<T> {
  const empty: RegistrySnapshot<T> = { items: [] };
  const store = createStore<RegistrySnapshot<T>>(empty);
  const byUid = new Map<string, T>();

  function commit(): void {
    const items = [...byUid.values()];
    if (items.some((item) => item.order !== undefined)) {
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    store.set({ items });
  }

  return {
    register(item) {
      byUid.set(item.uid, item);
      commit();
    },
    update(uid, patch) {
      const prev = byUid.get(uid);
      if (!prev) return;
      let changed = false;
      for (const key in patch) {
        if (!Object.is(prev[key as keyof T], patch[key as keyof Omit<T, "uid">])) {
          changed = true;
          break;
        }
      }
      // 没变就不 commit：React 里 effect 里无条件 update 会把自己抖成死循环
      if (!changed) return;
      byUid.set(uid, { ...prev, ...patch });
      commit();
    },
    unregister(uid) {
      if (byUid.delete(uid)) commit();
    },
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,
  };
}
