import { computed, onScopeDispose, shallowRef, watchEffect, type ComputedRef, type Ref } from "vue";
import { observeSize, type SizeBox, type SizeBoxMode } from "@shuimo-design/core";

/**
 * 量元素尺寸。底下是 core 的 observeSize（全库共用两个 ResizeObserver），
 * 所以 Vue 和 React 两边量出来的是同一套口径，也不用再依赖 @vueuse/core。
 *
 * 初值是 0×0 —— 服务端和水合首帧就是这个值，拿尺寸算出来的东西（笔触线、墨线）
 * 首帧一律不渲染，挂载后才补上。
 */
export function useSize(
  target: Readonly<Ref<HTMLElement | null>>,
  mode: SizeBoxMode = "content-box",
): { width: ComputedRef<number>; height: ComputedRef<number> } {
  const size = shallowRef<SizeBox>({ width: 0, height: 0 });
  let stop: (() => void) | undefined;

  // flush: "post" —— 要等这一轮 DOM 落地，模板 ref 才指向真元素
  watchEffect(
    () => {
      stop?.();
      stop = undefined;
      const el = target.value;
      if (!el) return;
      stop = observeSize(
        el,
        (box) => {
          if (size.value.width !== box.width || size.value.height !== box.height) size.value = box;
        },
        mode,
      );
    },
    { flush: "post" },
  );

  onScopeDispose(() => stop?.());

  return { width: computed(() => size.value.width), height: computed(() => size.value.height) };
}
