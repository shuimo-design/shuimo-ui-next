import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Controller } from "@shuimo-design/core";

/**
 * 把 core 的控制器接到 React 上。全库所有有状态的组件共用这一份胶水。
 *
 * 两处依赖 core 那边的契约，写在 runtime/controller.ts 的注释里：
 * - `update()` 是纯赋值，所以可以在渲染期调 —— 即使这次渲染被丢弃也没有副作用；
 * - `getServerSnapshot()` 的引用恒定，否则 useSyncExternalStore 会无限重渲染。
 */
// 快照类型从 getSnapshot 的返回值反推：写成独立泛型 S 的话没有推断点，会退化成 object
export function useController<O, C extends Controller<object, O>>(
  create: (initial: O) => C,
  options: O,
): [C, ReturnType<C["getSnapshot"]>] {
  const ref = useRef<C | null>(null);
  ref.current ??= create(options);
  const controller = ref.current;

  controller.update(options);

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );

  useEffect(() => {
    // StrictMode 会把这一对跑两轮，所以 connect / disconnect 必须幂等
    controller.connect();
    return () => controller.disconnect();
  }, [controller]);

  // 每轮提交之后补做 update() 记下、但不能在渲染期做的事（没有依赖数组是故意的）。
  // 控制器自己判断有没有真的变过，没变就是一次空调用
  useEffect(() => {
    controller.flush?.();
  });

  return [controller, state as ReturnType<C["getSnapshot"]>];
}
