/**
 * 函数式确认框（`await MConfirm.show("...")`）的队列。
 *
 * 和消息队列同一个道理：原来是 `createVNode + render + vnode.appContext` 往 body 上
 * 手挂一棵树，`useConfirm()` 存在的唯一理由是把当前应用的 appContext 偷记成模块级全局。
 * 现在改成"core 持有请求、框架层提供渲染出口"，确认框因此渲染在用户自己的树里。
 *
 * 一次只显示一个：后来的请求排队等前一个关掉。
 */
import { createStore } from "../runtime/store";
import { isClient } from "../runtime/dom";
import type { Unsubscribe } from "../runtime/store";
import type { ConfirmApi, ConfirmConfig, ConfirmProps } from "../components/confirm/types";

export interface ConfirmRequest {
  readonly id: number;
  readonly props: Omit<ConfirmProps, "teleport">;
  /** 出口把它绑到 MConfirm 的 open 上：点了确定 / 取消就翻成 false，走完离场动画再 remove */
  readonly open: boolean;
}

export interface ConfirmQueueSnapshot {
  /** 当前该显示的那一个；没有就是 undefined */
  readonly current: ConfirmRequest | undefined;
}

export interface ConfirmQueue {
  /** 弹出确认框：确定 resolve true，取消 / 点遮罩 / Esc resolve false */
  show(config: ConfirmConfig): Promise<boolean>;
  /** 再建一套独立的队列（要另外给它配一个出口） */
  create(): ConfirmQueue;

  /* ── 出口组件用的那几个 ─────────────────────────────────────── */
  subscribe(listener: () => void): Unsubscribe;
  getSnapshot(): ConfirmQueueSnapshot;
  /** 恒为空：弹层不进服务端 HTML */
  getServerSnapshot(): ConfirmQueueSnapshot;
  /** 用户点了确定 / 取消：立刻兑现承诺，并让面板开始离场 */
  settle(id: number, result: boolean): void;
  /** 离场动画结束，可以清掉了；下一个排队的接上 */
  remove(id: number): void;
  attachOutlet(): Unsubscribe;
}

const DEV =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.NODE_ENV !== "production";

const EMPTY: ConfirmQueueSnapshot = { current: undefined };

let nextId = 0;

interface Pending {
  request: ConfirmRequest;
  resolve: (value: boolean) => void;
  settled: boolean;
}

export function createConfirmQueue(): ConfirmQueue {
  const store = createStore<ConfirmQueueSnapshot>(EMPTY);
  const pending: Pending[] = [];
  let outlets = 0;
  let everAttached = false;
  let warned = false;

  function sync(): void {
    store.set({ current: pending[0]?.request });
  }

  function warnNoOutlet(): void {
    if (!DEV || warned || outlets > 0 || everAttached) return;
    warned = true;
    console.warn(
      "[shuimo] 没有找到渲染出口，确认框弹不出来。请在应用根部放一个 <MConfigProvider> 或 <MOverlayOutlet>。",
    );
  }

  return {
    show(config) {
      // 服务端不入队：队列是模块级单例，服务端往里塞会串到下一个请求
      if (!isClient()) return Promise.resolve(false);
      warnNoOutlet();
      const props = typeof config === "string" ? { content: config } : config;
      const id = ++nextId;
      return new Promise<boolean>((resolve) => {
        pending.push({ request: { id, props, open: true }, resolve, settled: false });
        sync();
      });
    },

    create: createConfirmQueue,

    subscribe: store.subscribe,
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,

    settle(id, result) {
      const item = pending.find((p) => p.request.id === id);
      // 已经定过的不重复兑现：点遮罩的同时按 Esc 这种也只算一次
      if (!item || item.settled) return;
      item.settled = true;
      item.resolve(result);
      // 没有出口接着时直接清掉：离场动画得有人渲染才播得起来
      if (outlets === 0) {
        const index = pending.indexOf(item);
        if (index >= 0) pending.splice(index, 1);
      } else {
        item.request = { ...item.request, open: false };
      }
      sync();
    },

    remove(id) {
      const index = pending.findIndex((p) => p.request.id === id);
      if (index < 0) return;
      const [item] = pending.splice(index, 1);
      // 出口被整个卸掉时也会走到这里，没人点过就按"取消"兑现，调用方不会一直挂着
      if (item && !item.settled) {
        item.settled = true;
        item.resolve(false);
      }
      sync();
    },

    attachOutlet() {
      outlets++;
      everAttached = true;
      return () => {
        outlets--;
        if (outlets > 0) return;
        // 最后一个出口走了：已经定过结果的请求没人给它播离场动画，直接清掉
        for (let i = pending.length - 1; i >= 0; i--) {
          if (pending[i]!.settled) pending.splice(i, 1);
        }
        sync();
      };
    },
  };
}

/** 默认队列。`MConfirm.show(...)` 用的就是这一份 */
export const confirm: ConfirmQueue = createConfirmQueue();

/** 把队列收窄成对外的那一个方法。`MConfirm.show(...)` 用的就是这一份 */
export function confirmApi(queue: ConfirmQueue): ConfirmApi {
  return {
    show: queue.show,
    create: () => confirmApi(queue.create()),
  };
}
