/**
 * 列表上下文的形状：MList 往下发一点静态配置，MListItem 取来用。
 *
 * 字段一律是**纯值**，不是 `Ref<T>` 也不是取值函数。
 * 取值函数是 Vue 响应式的产物 —— 父组件在自己的模板里读时才建立依赖；
 * React 里 getter 不触发重渲染，直接搬过去会静默失效。
 * 所以 core 只定形状，响应式包在外面：Vue 用 computed 包一层，React 直接进 createContext。
 */

export interface ListContextValue {
  /** 整个列表统一的"要不要显示项目符号" */
  readonly marker: boolean;
}

/** 外面没有 MList（单独用 MListItem）时的取值 */
export const LIST_CONTEXT_DEFAULT: ListContextValue = { marker: true };

/**
 * 项目符号三级取值：子项自己说了算 > 跟随列表 > 默认显示。
 *
 * 子项的 marker 必须能区分"没传"和"传了 false"，所以类型是 `boolean | undefined`，
 * 两个壳都不能给它补默认值（Vue 那边尤其要当心 Boolean 转型会把没传变成 false）。
 */
export function resolveListMarker(
  own: boolean | undefined,
  list: ListContextValue | undefined,
): boolean {
  return own ?? list?.marker ?? LIST_CONTEXT_DEFAULT.marker;
}
