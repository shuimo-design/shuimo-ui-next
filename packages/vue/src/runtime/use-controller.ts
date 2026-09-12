import { onMounted, onScopeDispose, shallowRef, watchEffect, type ShallowRef } from "vue";
import type { Controller } from "@shuimo-design/core";

/**
 * 把 core 的控制器接到 Vue 上。全库所有有状态的组件共用这一份胶水。
 *
 * `update()` 在 core 那边是纯赋值（不通知、不碰 DOM），所以这里可以用 watchEffect
 * 自动收集 options 里的响应式依赖，改一个字段就重新喂，不会打转。
 */
// 快照类型从 getSnapshot 的返回值反推：写成独立泛型 S 的话没有推断点，会退化成 object
export function useController<O, C extends Controller<object, O>>(
  create: (initial: O) => C,
  options: () => O,
): { controller: C; state: ShallowRef<ReturnType<C["getSnapshot"]>> } {
  type S = ReturnType<C["getSnapshot"]>;
  const controller = create(options());
  // 泛型 + shallowRef 的重载推断不出来，显式标一下
  const state = shallowRef(controller.getServerSnapshot()) as ShallowRef<S>;

  watchEffect(() => controller.update(options()));
  // 渲染落地之后补做 update() 记下、但不能在渲染期做的事。读一次 options() 是为了
  // 建立依赖：options 变 → 这个 post 阶段的副作用重跑一次
  watchEffect(
    () => {
      options();
      controller.flush?.();
    },
    { flush: "post" },
  );

  onMounted(() => {
    const stop = controller.subscribe(() => (state.value = controller.getSnapshot() as S));
    controller.connect();
    // connect 里可能同步改了状态，补读一次
    state.value = controller.getSnapshot() as S;
    onScopeDispose(() => {
      stop();
      controller.disconnect();
    });
  });

  return { controller, state };
}
