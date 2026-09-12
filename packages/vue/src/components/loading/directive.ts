import { createVNode, render, type Directive } from "vue";
import MLoading from "./MLoading.vue";

const PARENT_CLASS = "m-loading-parent";
const HOST_CLASS = "m-loading-host";
/** 宿主 → 挂载容器；WeakMap 让宿主被移除时一起回收 */
const hosts = new WeakMap<HTMLElement, HTMLElement>();

function show(el: HTMLElement) {
  if (hosts.has(el)) return;
  // 宿主自己已经定位过（absolute / fixed / sticky）就别改成 relative，会把它从原来的位置拽下来
  if (getComputedStyle(el).position === "static") el.classList.add(PARENT_CLASS);
  const host = document.createElement("div");
  host.className = HOST_CLASS;
  // render 会接管容器的子树，不能直接渲染进宿主，否则宿主原来的内容会被抹掉
  render(createVNode(MLoading, { mask: true, text: el.dataset.loadingText }), host);
  el.appendChild(host);
  hosts.set(el, host);
}

function hide(el: HTMLElement) {
  const host = hosts.get(el);
  if (!host) return;
  render(null, host);
  host.remove();
  hosts.delete(el);
  el.classList.remove(PARENT_CLASS);
}

/**
 * v-loading / v-loading="isLoading"：在宿主元素上盖一层遮罩加载。
 * 不写值等于 true；文字可用 data-loading-text="正在加载" 传。
 */
export const vLoading: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, binding) {
    if (binding.value ?? true) show(el);
  },
  updated(el, binding) {
    if (binding.value ?? true) show(el);
    else hide(el);
  },
  unmounted(el) {
    hide(el);
  },
};
