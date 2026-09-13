/**
 * 泛型组件 v-model 的"没有默认值"默认值。
 *
 * `defineModel<M>()` 不给 default，Vue 会把回写事件 `update:modelValue` 的参数类型定成
 * `M | undefined`——父组件绑一个 `ref("a")` 就接不住，strictTemplates 下直接报错。
 * 而这些组件（单选组、滑块、下拉…）从不主动写回 undefined：要么写回一个值，要么形状里
 * 本来就包含 undefined（下拉清空、手风琴全收起）并已经写进 M 里了。
 *
 * 所以给 default 传这个函数：运行时仍然是 undefined（各 core 辅助函数都接受未绑定的 model），
 * 类型上让 Vue 走"有默认值"那条重载，事件参数就是干净的 M。
 * 只能写成函数：字面量默认值那条重载要求先把 M 判定为原始类型，泛型 M 过不了。
 */
export function unboundModel<M>(): M {
  return undefined as unknown as M;
}
