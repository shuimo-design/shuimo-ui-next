/**
 * 函数式通知（`MNotification.success({ title })`）的队列。
 *
 * 和消息队列（message-queue.ts）同一个模子：归一化、发号、closed 承诺、按角分组、closeAll
 * 整套在这里，框架层只提供一个"渲染出口"组件 `<MOverlayOutlet>` 订阅它。
 * 通知渲染在用户自己的组件树里 —— 读得到用户的 provider、DevTools 看得见。
 * 代价是用户必须在树里放一个出口（`<MConfigProvider>` 自带，或者自己放一个 `<MOverlayOutlet>`）。
 * 没有出口时不能静默失灵，所以 open() 会在开发模式下警告一句。
 */
import { createStore } from "../runtime/store";
import { isClient } from "../runtime/dom";
import type { Unsubscribe } from "../runtime/store";
import { NOTIFICATION_PLACEMENTS } from "../components/notification/index";
import type {
  NotificationApi,
  NotificationConfig,
  NotificationHandle,
  NotificationPlacement,
  NotificationProps,
  NotificationType,
} from "../components/notification/types";

/**
 * 生产构建里打包器会把 `process.env.NODE_ENV` 换成字面量，这个常量连同下面那句警告一起被摇掉。
 * 不写 `process.xxx` 而是从 globalThis 上摸，是为了不让 core 依赖 node 的类型。
 */
const DEV =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.NODE_ENV !== "production";

export interface NotificationEntry {
  readonly id: number;
  /** 已经归一化过的 props（字符串配置在这之前就变成了 { title } ） */
  readonly props: NotificationProps;
  /**
   * 队列要求它离场（`handle.close()` / `closeAll()`）。
   * 出口把它透给 `<MNotification>`，由通知自己走完离场动画再回报 `remove(id)` ——
   * 队列不碰 DOM，动画时序归控制器管。
   */
  readonly closing: boolean;
}

export interface NotificationQueueSnapshot {
  readonly items: readonly NotificationEntry[];
}

export interface NotificationGroup {
  readonly placement: NotificationPlacement;
  readonly items: readonly NotificationEntry[];
}

export interface NotificationQueue {
  open(config: NotificationConfig, type?: NotificationType): NotificationHandle;
  success(config: NotificationConfig): NotificationHandle;
  info(config: NotificationConfig): NotificationHandle;
  warning(config: NotificationConfig): NotificationHandle;
  error(config: NotificationConfig): NotificationHandle;
  /** 关闭全部通知；传 placement 只关那个角的 */
  closeAll(placement?: NotificationPlacement): void;
  /** 再建一套独立的队列（要另外给它配一个出口） */
  create(): NotificationQueue;

  /* ── 出口组件用的那几个 ─────────────────────────────────────── */
  subscribe(listener: () => void): Unsubscribe;
  /** 引用恒定直到内容真的变了 */
  getSnapshot(): NotificationQueueSnapshot;
  /** 恒为空队列：弹层不进服务端 HTML */
  getServerSnapshot(): NotificationQueueSnapshot;
  /** 某条的离场动画走完了，可以从列表里拿掉（它的 closed 承诺和 onClose 在这里兑现） */
  remove(id: number): void;
  /** 请求某条离场（关闭按钮走它，出口自己也可以调） */
  requestClose(id: number): void;
  /** 出口挂上时登记一下，返回撤销函数；open() 靠它判断"有没有人接" */
  attachOutlet(): Unsubscribe;
}

/** 全局发号，跨队列也不重号 */
let nextId = 0;

const EMPTY: NotificationQueueSnapshot = { items: [] };

/** 按固定的角顺序分组，空角不出现；出口按它渲染栈容器 */
export function notificationGroups(snapshot: NotificationQueueSnapshot): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  for (const placement of NOTIFICATION_PLACEMENTS) {
    const items = snapshot.items.filter(
      (item) => (item.props.placement ?? "top-right") === placement,
    );
    if (items.length > 0) groups.push({ placement, items });
  }
  return groups;
}

/** 字符串配置 → { title }；type 显式传了就盖上去。onClose 不进 props，单独留给队列在移除时调 */
function normalize(
  config: NotificationConfig,
  type?: NotificationType,
): { props: NotificationProps; onClose?: () => void } {
  if (typeof config === "string") return { props: { title: config, ...(type ? { type } : {}) } };
  const { onClose, ...props } = config;
  if (type) props.type = type;
  return { props, onClose };
}

/** 没有出口时的空句柄：不入队，closed 立刻兑现，调用方不会挂在那儿等 */
const NOOP_HANDLE: NotificationHandle = { close() {}, closed: Promise.resolve() };

export function createNotificationQueue(): NotificationQueue {
  const store = createStore<NotificationQueueSnapshot>(EMPTY);
  /** id → 这条通知移除时要做的事：兑现 closed 承诺、调用户的 onClose */
  const settlers = new Map<number, () => void>();
  let outlets = 0;
  let everAttached = false;
  let warned = false;

  function patch(id: number, changes: Partial<NotificationEntry>): void {
    const items = store.get().items;
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const next = [...items];
    next[index] = { ...items[index]!, ...changes };
    store.set({ items: next });
  }

  function warnNoOutlet(): void {
    // 出口是在挂载后才登记的，所以"从来没登记过"才算真的没人接：
    // 模块加载期就调 open() 的写法不该被误报
    if (!DEV || warned || outlets > 0 || everAttached) return;
    warned = true;
    console.warn(
      "[shuimo] 没有找到渲染出口，通知弹不出来。请在应用根部放一个 <MConfigProvider> 或 <MOverlayOutlet>。",
    );
  }

  function open(config: NotificationConfig, type?: NotificationType): NotificationHandle {
    // 服务端不入队：队列是模块级单例，服务端往里塞会串到下一个请求
    if (!isClient()) return NOOP_HANDLE;
    warnNoOutlet();
    const { props, onClose } = normalize(config, type);
    const id = ++nextId;
    // Promise 的执行器是同步跑的，这里登记完再入队，不会有"移除时还没登记"的窗口
    const closed = new Promise<void>((resolve) => {
      settlers.set(id, () => {
        resolve();
        onClose?.();
      });
    });
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
    open: (config, type) => open(config, type),
    success: (config) => open(config, "success"),
    info: (config) => open(config, "info"),
    warning: (config) => open(config, "warning"),
    error: (config) => open(config, "error"),

    closeAll(placement) {
      for (const item of store.get().items) {
        if (placement && (item.props.placement ?? "top-right") !== placement) continue;
        requestClose(item.id);
      }
    },

    create: createNotificationQueue,

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

/** 默认队列。`MNotification.success(...)` 用的就是这一份 */
export const notification: NotificationQueue = createNotificationQueue();

/**
 * 把队列收窄成对外的那几个方法。`MNotification` 上挂的就是这一份 ——
 * 订阅、移除、登记出口是出口组件的事，不该出现在 `MNotification.` 的补全列表里。
 */
export function notificationApi(queue: NotificationQueue): NotificationApi {
  return {
    open: queue.open,
    success: queue.success,
    info: queue.info,
    warning: queue.warning,
    error: queue.error,
    closeAll: queue.closeAll,
    create: () => notificationApi(queue.create()),
  };
}
