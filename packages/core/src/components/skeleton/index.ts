/**
 * 骨架屏的无框架部分：class 派生、段落行数归一化，以及 throttle 那个定时器。
 *
 * 定时器写成控制器，是因为它有"时序"——loading 翻成 true 之后要等一段时间才露脸，
 * 中途翻回 false 要把等待撤掉。两个壳各写一遍 setTimeout / clearTimeout 就会各错一次。
 */
import { createStore } from "../../runtime/store";
import type { Controller } from "../../runtime/controller";
import type { SkeletonItemVariant } from "./types";

export type { SkeletonItemProps, SkeletonItemVariant, SkeletonProps, SkeletonSlots } from "./types";

export function skeletonClasses(animated: boolean): string[] {
  return ["m-skeleton", ...(animated ? ["m-skeleton--animated"] : [])];
}

export function skeletonItemClasses(variant: SkeletonItemVariant = "text"): string[] {
  return ["m-skeleton-item", `m-skeleton-item--${variant}`];
}

/**
 * 段落要画的行。Vue 的 `v-for="i in rows"` 从 1 数到 rows，React 要一个真数组，
 * 归一化放这里两边就拿到同一串 key（行数为负或不是整数时不画）。
 */
export function skeletonRows(rows: number): number[] {
  const n = Math.floor(rows);
  if (!Number.isFinite(n) || n <= 0) return [];
  return Array.from({ length: n }, (_, i) => i + 1);
}

/* ── throttle 控制器 ─────────────────────────────────────────── */

export interface SkeletonOptions {
  /** 是否在加载中 */
  loading: boolean;
  /** loading 变 true 后延迟多少毫秒才露出骨架 */
  throttle: number;
}

export interface SkeletonSnapshot {
  /** 骨架该不该画出来。throttle 窗口内是 false —— 这段时间里骨架和真实内容都不画 */
  readonly visible: boolean;
}

export interface SkeletonController extends Controller<SkeletonSnapshot, SkeletonOptions> {
  /** loading 变了由壳在 effect 里调；等价于 Vue 原来的 watch(() => loading) */
  setLoading(loading: boolean): void;
}

/**
 * 服务端也算得出来的初值：没有 throttle 时首帧就该画骨架，有 throttle 时首帧什么都不画。
 * 注意这个对象是**每个实例一份**，引用在实例的生命周期内恒定（store 的 getServer 返回的就是它），
 * 满足 useSyncExternalStore 对 getServerSnapshot 的要求。
 */
function initialSnapshot(o: SkeletonOptions): SkeletonSnapshot {
  return { visible: o.loading && o.throttle <= 0 };
}

export function createSkeleton(initial: SkeletonOptions): SkeletonController {
  const store = createStore<SkeletonSnapshot>(initialSnapshot(initial));
  let options = initial;
  /** 最近一次要求的 loading；未 connect 时只记不办 */
  let wanted = initial.loading;
  let connected = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function clear(): void {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  }

  function apply(): void {
    clear();
    if (!connected) return;
    if (!wanted) {
      store.set({ visible: false });
      return;
    }
    // 已经露过脸就别再等：StrictMode 反复 connect / disconnect 时不该把骨架收回去
    if (options.throttle <= 0 || store.get().visible) {
      store.set({ visible: true });
      return;
    }
    store.set({ visible: false });
    timer = setTimeout(() => {
      timer = undefined;
      store.set({ visible: true });
    }, options.throttle);
  }

  return {
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,
    subscribe: store.subscribe,

    update(next) {
      options = next;
    },

    connect() {
      if (connected) return;
      connected = true;
      apply();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      clear();
    },

    setLoading(loading) {
      if (wanted === loading) return;
      wanted = loading;
      apply();
    },
  };
}
