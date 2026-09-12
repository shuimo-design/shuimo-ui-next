import { createVNode, render, type Directive } from "vue";
import { closeLoadingHost, loadingHostText, openLoadingHost } from "@shuimo-design/core";
import MLoading from "./MLoading.vue";

/**
 * v-loading / v-loading="isLoading"：在宿主元素上盖一层遮罩加载。
 * 不写值等于 true；文字可用 data-loading-text="正在加载" 传。
 *
 * 容器的生死和宿主的定位在 core 的 openLoadingHost / closeLoadingHost 里，
 * 这里只负责 Vue 特有的那一步：把组件命令式地渲染进容器。
 */
function show(el: HTMLElement) {
  const host = openLoadingHost(el);
  if (!host) return;
  render(createVNode(MLoading, { mask: true, text: loadingHostText(el) }), host);
}

function hide(el: HTMLElement) {
  const host = closeLoadingHost(el);
  if (!host) return;
  render(null, host);
  host.remove();
}

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
