import { useCallback, useEffect, useMemo, useRef } from "react";
import { createBrushBorder, type BrushBorderControllerOptions } from "@shuimo-design/core/ink";

/**
 * 给元素挂笔触边框。返回的是一个 **ref 回调**，直接绑在元素上：`<div ref={brush}>`。
 * 生成、分桶、缓存、描出动画全在 core 的控制器里（和 Vue 那边同一份），
 * 这里只管三件 React 才有的事：建控制器、props 变了重新喂、卸载时收摊。
 */
export function useBrushBorder(options: BrushBorderControllerOptions) {
  // 控制器只建一次；options 每次渲染都是新对象，不能进依赖数组
  const controller = useMemo(() => createBrushBorder(options), []); // eslint-disable-line react-hooks/exhaustive-deps
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    controller.update(latest.current);
  });
  useEffect(() => () => controller.dispose(), [controller]);

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，白白重画一次
  return useCallback((el: HTMLElement | null) => controller.attach(el), [controller]);
}
