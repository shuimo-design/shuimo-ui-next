/**
 * 函数式消息（`MMessage.success("...")`）的队列。
 *
 * **为什么要重做**：原来两个 api.ts 是用 `createVNode + render + vnode.appContext`
 * 往 body 上手挂一棵树的。`useMessage()` 存在的唯一理由，就是偷偷把当前应用的 appContext
 * 记成模块级全局、再塞给那棵手挂的树 —— React 里没有任何对等物，这条路走不通。
 *
 * **新做法**：队列（归一化、发号、closed 承诺、按方向分组、closeAll）整套在这里，
 * 框架层只提供一个"渲染出口"组件 `<MOverlayOutlet>` 订阅它。
 *
 * 这是净赚的一笔：消息从此渲染在**用户自己的组件树里** —— 读得到用户的 provider、
 * DevTools 看得见、不用再借上下文。代价是用户必须在树里放一个出口
 * （`<MConfigProvider>` 自带，或者自己放一个 `<MOverlayOutlet>`）。
 * 没有出口时不能静默失灵，所以 show() 会在开发模式下警告一句。
 */
import { createStore } from "../runtime/store";
import { isClient } from "../runtime/dom";
import type { Unsubscribe } from "../runtime/store";
import { MESSAGE_DIRECTIONS } from "../components/message/index";
import type {
  MessageApi,
  MessageConfig,
  MessageDirection,
  MessageHandle,
  MessageProps,
  MessageType,
} from "../components/message/types";

/**
 * 生产构建里打包器会把 `process.env.NODE_ENV` 换成字面量，这个常量连同下面那句警告一起被摇掉。
 * 不写 `process.xxx` 而是从 globalThis 上摸，是为了不让 core 依赖 node 的类型。
 */
const DEV =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.NODE_ENV !== "production";

export interface MessageEntry {
  readonly id: number;
  /** 已经归一化过的 props（字符串配置在这之前就变成了 { content } ） */
  readonly props: MessageProps;
  /**
   * 队列要求它离场（`handle.close()` / `closeAll()`）。
   * 出口把它透给 `<MMessage>`，由消息自己走完离场动画再回报 `remove(id)` ——
   * 队列不碰 DOM，动画时序归控制器管。
   */
  readonly closing: boolean;
}

export interface MessageQueueSnapshot {
  readonly items: readonly MessageEntry[];
}

export interface MessageGroup {
  readonly direction: MessageDirection;
  readonly items: readonly MessageEntry[];
}

export interface MessageQueue {
  show(config: MessageConfig, type?: MessageType, duration?: number): MessageHandle;
  success(config: MessageConfig, duration?: number): MessageHandle;
  warning(config: MessageConfig, duration?: number): MessageHandle;
  info(config: MessageConfig, duration?: number): MessageHandle;
  error(config: MessageConfig, duration?: number): MessageHandle;
  /** 关闭全部消息；传 direction 只关那个方向的 */
  closeAll(direction?: MessageDirection): void;
  /** 再建一套独立的队列（要另外给它配一个出口） */
  create(): MessageQueue;

  /* ── 出口组件用的那几个 ─────────────────────────────────────── */
  subscribe(listener: () => void): Unsubscribe;
  /** 引用恒定直到内容真的变了 */
  getSnapshot(): MessageQueueSnapshot;
  /** 恒为空队列：弹层不进服务端 HTML */
  getServerSnapshot(): MessageQueueSnapshot;
  /** 某条的离场动画走完了，可以从列表里拿掉（它的 closed 承诺在这里兑现） */
  remove(id: number): void;
  /** 请求某条离场（关闭按钮、拖出去都走它，出口自己也可以调） */
  requestClose(id: number): void;
  /** 出口挂上时登记一下，返回撤销函数；show() 靠它判断"有没有人接" */
  attachOutlet(): Unsubscribe;
}

/** 全局发号，跨队列也不重号：同一页上不同队列的消息混在一起也能各认各的 */
let nextId = 0;

const EMPTY: MessageQueueSnapshot = { items: [] };

/** 按固定的方向顺序分组，空方向不出现；出口按它渲染列表容器 */
export function messageGroups(snapshot: MessageQueueSnapshot): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const direction of MESSAGE_DIRECTIONS) {
    const items = snapshot.items.filter(
      (item) => (item.props.direction ?? "top-right") === direction,
    );
    if (items.length > 0) groups.push({ direction, items });
  }
  return groups;
}

/** 字符串配置 → { content }；type / duration 显式传了就盖上去 */
function normalize(config: MessageConfig, type?: MessageType, duration?: number): MessageProps {
  const props: MessageProps = typeof config === "string" ? { content: config } : { ...config };
  if (type) props.type = type;
  if (duration !== undefined) props.duration = duration;
  return props;
}

/** 没有出口时的空句柄：不入队，closed 立刻兑现，调用方不会挂在那儿等 */
const NOOP_HANDLE: MessageHandle = { close() {}, closed: Promise.resolve() };

export function createMessageQueue(): MessageQueue {
  const store = createStore<MessageQueueSnapshot>(EMPTY);
  /** id → 这条消息移除时要兑现的 resolve */
  const settlers = new Map<number, () => void>();
  let outlets = 0;
  let everAttached = false;
  let warned = false;

  function patch(id: number, changes: Partial<MessageEntry>): void {
    const items = store.get().items;
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const next = [...items];
    next[index] = { ...items[index]!, ...changes };
    store.set({ items: next });
  }

  function warnNoOutlet(): void {
    // 出口是在挂载后才登记的，所以"从来没登记过"才算真的没人接：
    // 模块加载期就调 show() 的写法不该被误报
    if (!DEV || warned || outlets > 0 || everAttached) return;
    warned = true;
    console.warn(
      "[shuimo] 没有找到渲染出口，消息弹不出来。请在应用根部放一个 <MConfigProvider> 或 <MOverlayOutlet>。",
    );
  }

  function show(config: MessageConfig, type?: MessageType, duration?: number): MessageHandle {
    // 服务端不入队：队列是模块级单例，服务端往里塞会串到下一个请求
    if (!isClient()) return NOOP_HANDLE;
    warnNoOutlet();
    const props = normalize(config, type, duration);
    const id = ++nextId;
    let settle: (() => void) | undefined;
    const closed = new Promise<void>((resolve) => {
      settle = resolve;
    });
    if (settle) settlers.set(id, settle);
    store.set({ items: [...store.get().items, { id, props, closing: false }] });
    return { close: () => requestClose(id), closed };
  }

  /**
   * 请求离场。没有出口接着时直接删掉：离场动画得有人渲染才播得起来，
   * 挂在那儿等一个永远不会来的 `remove(id)`，调用方的 `closed` 承诺就再也兑现不了。
   */
  function requestClose(id: number): void {
    if (outlets === 0) {
      removeEntry(id);
      return;
    }
    patch(id, { closing: true });
  }

  function removeEntry(id: number): void {
    const items = store.get().items;
    if (!items.some((item) => item.id === id)) return;
    store.set({ items: items.filter((item) => item.id !== id) });
    settlers.get(id)?.();
    settlers.delete(id);
  }

  return {
    show: (config, type, duration) => show(config, type, duration),
    success: (config, duration) => show(config, "success", duration),
    warning: (config, duration) => show(config, "warning", duration),
    info: (config, duration) => show(config, "info", duration),
    error: (config, duration) => show(config, "error", duration),

    closeAll(direction) {
      for (const item of store.get().items) {
        if (direction && (item.props.direction ?? "top-right") !== direction) continue;
        requestClose(item.id);
      }
    },

    create: createMessageQueue,

    subscribe: store.subscribe,
    getSnapshot: store.get,
    getServerSnapshot: store.getServer,

    remove: removeEntry,

    requestClose,

    attachOutlet() {
      outlets++;
      everAttached = true;
      return () => {
        outlets--;
        if (outlets > 0) return;
        // 最后一个出口走了：正在离场的那几条再也不会有人播完动画回报，直接清掉，
        // 免得它们的 closed 承诺永远吊着、下一个出口挂上来又把它们渲染一遍
        for (const item of store.get().items) if (item.closing) removeEntry(item.id);
      };
    },
  };
}

/** 默认队列。`MMessage.success(...)` 用的就是这一份 */
export const message: MessageQueue = createMessageQueue();

/**
 * 把队列收窄成对外的那几个方法。`MMessage` 上挂的就是这一份 ——
 * 订阅、移除、登记出口是出口组件的事，不该出现在 `MMessage.` 的补全列表里。
 * 这些方法都是闭包，不依赖 this，摘下来单独用没问题。
 */
export function messageApi(queue: MessageQueue): MessageApi {
  return {
    show: queue.show,
    success: queue.success,
    warning: queue.warning,
    info: queue.info,
    error: queue.error,
    closeAll: queue.closeAll,
    create: () => messageApi(queue.create()),
  };
}
