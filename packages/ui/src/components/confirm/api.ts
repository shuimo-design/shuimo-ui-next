/**
 * 函数式确认框：await MConfirm.show("...") / useConfirm().show({...})。
 * 每次调用往 body 挂一个宿主，确定 / 取消立刻 resolve，等离场动画走完再卸载。
 */
import {
  createVNode,
  defineComponent,
  getCurrentInstance,
  h,
  ref,
  render,
  type AppContext,
} from "vue";
import MConfirm from "./MConfirm.vue";
import type { ConfirmApi } from "./types";

export function createConfirm(getContext: () => AppContext | null = () => null): ConfirmApi {
  return {
    show(config) {
      if (typeof document === "undefined") return Promise.resolve(false);
      const props = typeof config === "string" ? { content: config } : config;
      return new Promise<boolean>((resolve) => {
        const host = document.createElement("div");
        host.className = "m-confirm-host";
        document.body.appendChild(host);
        // 用一个小宿主组件持有 open 状态：关闭要先走完离场动画，afterLeave 之后才卸载
        const Host = defineComponent({
          name: "MConfirmHost",
          setup() {
            const open = ref(true);
            return () =>
              h(MConfirm, {
                ...props,
                teleport: false,
                open: open.value,
                "onUpdate:open": (value: boolean) => {
                  open.value = value;
                },
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
                onClosed: () => {
                  render(null, host);
                  host.remove();
                },
              });
          },
        });
        const vnode = createVNode(Host);
        vnode.appContext = getContext();
        render(vnode, host);
      });
    },
  };
}

/** 默认实例；组件里通过 useConfirm() 拿它时会把当前应用的上下文借给它 */
let defaultContext: AppContext | null = null;
export const confirm: ConfirmApi = createConfirm(() => defaultContext);

export function useConfirm(): ConfirmApi {
  const instance = getCurrentInstance();
  if (instance && !defaultContext) defaultContext = instance.appContext;
  return confirm;
}
