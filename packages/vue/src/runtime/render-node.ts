import type { FunctionalComponent, VNodeChild } from "vue";

/**
 * 配置数组里"一段内容"在 Vue 这边的类型。
 *
 * 可以直接给字符串，也可以给一个返回 VNode 的函数 —— **推荐给函数**：
 * 同一个 VNode 对象被渲染两次会被 Vue 警告，写成函数每轮渲染各建一份就没这问题。
 */
export type VueNode = VNodeChild | (() => VNodeChild);

/**
 * 把 VueNode 渲染出来。写成函数式组件，模板里才好 `<RenderNode :node="..." />`：
 * 字符串、VNode、数组、返回它们的函数都吃得下。
 */
export const RenderNode: FunctionalComponent<{ node: VueNode }> = (props) => {
  const node = typeof props.node === "function" ? props.node() : props.node;
  return node as ReturnType<FunctionalComponent>;
};
RenderNode.props = ["node"];
