/**
 * 函数式消息：MMessage.success("...") / useMessage().show({...})。
 * 每个方向第一次用到时才往 body 挂一个 MMessageList 容器，之后往里追加。
 */
import { createVNode, getCurrentInstance, render, type AppContext } from "vue";
import MMessageList from "./MMessageList.vue";
import type { MessageListExposed } from "./internal";
import type {
  MessageApi,
  MessageConfig,
  MessageDirection,
  MessageHandle,
  MessageProps,
  MessageType,
} from "./types";

let nextId = 0;

interface ListHost {
  exposed: MessageListExposed;
  el: HTMLElement;
}

/** SSR 或没有 DOM 时返回的空句柄 */
const NOOP_HANDLE: MessageHandle = { close() {}, closed: Promise.resolve() };

/**
 * 建一套独立的消息队列。getContext 提供挂容器时用的应用上下文（拿到全局注册的组件、provide 的值），
 * 延迟取值是因为 useMessage() 可能在容器创建之前就被调用。
 */
export function createMessage(getContext: () => AppContext | null = () => null): MessageApi {
  const hosts = new Map<MessageDirection, ListHost>();

  function host(direction: MessageDirection): ListHost {
    const hit = hosts.get(direction);
    if (hit) return hit;
    const el = document.createElement("div");
    el.className = "m-message-host";
    document.body.appendChild(el);
    const vnode = createVNode(MMessageList, { direction });
    vnode.appContext = getContext();
    render(vnode, el);
    // 没有渲染中的组件实例时 ref 拿不到 owner，只能从 vnode 上取 defineExpose 出来的对象
    const exposed = vnode.component?.exposed as MessageListExposed | null | undefined;
    if (!exposed) throw new Error("[shuimo] MMessageList 挂载失败");
    const created: ListHost = { exposed, el };
    hosts.set(direction, created);
    return created;
  }

  function normalize(config: MessageConfig, type?: MessageType, duration?: number): MessageProps {
    const props: MessageProps = typeof config === "string" ? { content: config } : { ...config };
    if (type) props.type = type;
    if (duration !== undefined) props.duration = duration;
    return props;
  }

  function show(config: MessageConfig, type?: MessageType, duration?: number): MessageHandle {
    if (typeof document === "undefined") return NOOP_HANDLE;
    const props = normalize(config, type, duration);
    const direction = props.direction ?? "top-right";
    const list = host(direction).exposed;
    const id = ++nextId;
    let settle: (() => void) | undefined;
    const closed = new Promise<void>((resolve) => {
      settle = resolve;
    });
    list.add({ id, props, onClosed: () => settle?.() });
    return { close: () => list.close(id), closed };
  }

  return {
    show: (config) => show(config),
    success: (config, duration) => show(config, "success", duration),
    warning: (config, duration) => show(config, "warning", duration),
    info: (config, duration) => show(config, "info", duration),
    error: (config, duration) => show(config, "error", duration),
    closeAll(direction) {
      if (direction) {
        hosts.get(direction)?.exposed.closeAll();
        return;
      }
      for (const item of hosts.values()) item.exposed.closeAll();
    },
    create: () => createMessage(getContext),
  };
}

/** 默认的全局队列；组件里通过 useMessage() 拿它时会把当前应用的上下文借给它 */
let defaultContext: AppContext | null = null;
export const message: MessageApi = createMessage(() => defaultContext);

export function useMessage(): MessageApi {
  const instance = getCurrentInstance();
  if (instance && !defaultContext) defaultContext = instance.appContext;
  return message;
}
