import { onBeforeUnmount, onMounted, watch, watchEffect, type Ref } from "vue";
import { createBrushBorder, type BrushBorderControllerOptions } from "@shuimo-design/core/ink";

export interface UseBrushBorderOptions extends Omit<BrushBorderControllerOptions, "enabled"> {
  /** 关掉时不生成也不打标记；不传则跟随 html.m-ink-ready */
  enabled?: Ref<boolean> | boolean;
}

/**
 * 给元素挂笔触边框。生成、分桶、缓存、描出动画全在 core 的控制器里
 * （`createBrushBorder`，15 个组件共用同一份），这里只管三件 Vue 才有的事：
 * 跟着模板 ref 拿元素、参数变了重新喂、组件卸载时收摊。
 */
export function useBrushBorder(
  target: Ref<HTMLElement | null>,
  options: UseBrushBorderOptions = {},
) {
  const resolved = (): BrushBorderControllerOptions => {
    const { enabled, ...rest } = options;
    return {
      ...rest,
      ...(enabled === undefined
        ? {}
        : { enabled: typeof enabled === "boolean" ? enabled : enabled.value }),
    };
  };
  const controller = createBrushBorder(resolved());

  onMounted(() => {
    // options 常常是 reactive 的（MBorder 就把 props 包成 reactive 传进来），
    // 用 watchEffect 自动收集里面的依赖，改一个字段就重新喂。
    // flush: "post" —— 要等这一轮 DOM 更新完，量到的才是新尺寸
    watchEffect(() => controller.update(resolved()), { flush: "post" });
    watch(target, (el) => controller.attach(el), { immediate: true, flush: "post" });
  });
  onBeforeUnmount(() => controller.dispose());

  /** 强制重画：参数没走响应式、或者字体加载完之后要重新量的时候调 */
  return {
    update: () => {
      controller.update(resolved());
      controller.refresh();
    },
  };
}
