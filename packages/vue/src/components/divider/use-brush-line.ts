import { onBeforeUnmount, onMounted, watch, watchEffect, type Ref } from "vue";
import { createBrushLine, type BrushLineControllerOptions } from "@shuimo-design/core";

export interface UseBrushLineOptions extends Omit<BrushLineControllerOptions, "vertical"> {
  /** 竖线；传函数就跟着它的返回值走（在 watchEffect 里收集依赖，方向变了会重画） */
  vertical: boolean | (() => boolean);
}

/**
 * 给一段线元素按实际长度挂笔触线。量尺寸、分桶、生成、写变量全在 core 的控制器里
 * （`createBrushLine`，分割线 / 卡片 / 标签页 / 折叠面板 / 步骤条共用同一份），
 * 这里只管三件 Vue 才有的事：跟着模板 ref 拿元素、参数变了重新喂、组件卸载时收摊。
 */
export function useBrushLine(target: Ref<HTMLElement | null>, options: UseBrushLineOptions) {
  const resolved = (): BrushLineControllerOptions => ({
    ...options,
    vertical: typeof options.vertical === "function" ? options.vertical() : options.vertical,
  });
  const controller = createBrushLine(resolved());

  onMounted(() => {
    // flush: "post" —— 要等这一轮 DOM 更新完，量到的才是新尺寸
    watchEffect(() => controller.update(resolved()), { flush: "post" });
    watch(target, (el) => controller.attach(el), { immediate: true, flush: "post" });
  });
  onBeforeUnmount(() => controller.dispose());
}
