/**
 * 在宿主元素上盖一层加载遮罩。
 *
 * Vue 的 v-loading 指令原来自己做这件事（改宿主的定位、建容器、命令式渲染组件），
 * 那是 DOM 操作，不该留在壳里。这里只管**容器的生死和宿主的定位**，
 * 遮罩内容长什么样由调用方渲染进这个容器 —— Vue 用 render(createVNode(MLoading))，
 * React 用 createRoot().render(<MLoading/>)，各写各的挂载方式，逻辑只有这一份。
 */

const PARENT_CLASS = "m-loading-parent";
const HOST_CLASS = "m-loading-host";
/** 宿主 → 挂载容器；WeakMap 让宿主被移除时一起回收 */
const hosts = new WeakMap<HTMLElement, HTMLElement>();

/**
 * 给宿主准备一个遮罩容器。已经有了就返回 null，调用方据此知道"不用重复渲染"。
 */
export function openLoadingHost(el: HTMLElement): HTMLElement | null {
  if (hosts.has(el)) return null;
  // 宿主自己已经定位过（absolute / fixed / sticky）就别改成 relative，会把它从原来的位置拽下来
  if (getComputedStyle(el).position === "static") el.classList.add(PARENT_CLASS);
  const host = document.createElement("div");
  host.className = HOST_CLASS;
  // 容器要单独建：直接渲染进宿主会把宿主原来的内容抹掉
  el.appendChild(host);
  hosts.set(el, host);
  return host;
}

/** 收掉遮罩容器；返回被摘下来的容器，调用方拿它去卸载自己渲染的东西 */
export function closeLoadingHost(el: HTMLElement): HTMLElement | null {
  const host = hosts.get(el);
  if (!host) return null;
  hosts.delete(el);
  el.classList.remove(PARENT_CLASS);
  return host;
}

/** 宿主上配的加载文字（data-loading-text） */
export function loadingHostText(el: HTMLElement): string | undefined {
  return el.dataset.loadingText;
}
