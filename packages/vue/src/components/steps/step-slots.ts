import { Comment, Fragment, computed, defineComponent, h, isVNode, provide, Text } from "vue";
import type { PropType, VNode, VNodeArrayChildren } from "vue";
import type { StepIndexContextValue } from "@shuimo-design/core";
import { stepIndexKey } from "./context";

/**
 * 把默认插槽摊平成"一步一个节点"的列表。
 *
 * - v-for 编译出来是一个 Fragment，真正的各步在它的 children 里，所以要递归摊平
 *   （对应 React 那边 `Children.toArray` 会把数组摊平）；
 * - v-if 为假留下的是注释节点，模板里的换行是空白文本节点，两种都不算一步。
 *
 * 只认直接子节点：把 MStep 包进自己的 div 里就数不到了，那一步会退化成"单独一步"。
 * React 侧同理（`Children.toArray` 也只看直接子节点），两个壳的行为是一致的。
 */
export function flattenSteps(nodes: VNodeArrayChildren | undefined): VNode[] {
  const out: VNode[] = [];
  for (const node of nodes ?? []) {
    if (Array.isArray(node)) {
      out.push(...flattenSteps(node));
      continue;
    }
    if (!isVNode(node)) continue;
    if (node.type === Comment) continue;
    if (node.type === Fragment) {
      out.push(...flattenSteps(node.children as VNodeArrayChildren));
      continue;
    }
    if (node.type === Text && typeof node.children === "string" && node.children.trim() === "") {
      continue;
    }
    out.push(node);
  }
  return out;
}

/**
 * 只为"把位置发给这一步"存在的隐形组件：自己不产出任何 DOM，把拿到的节点原样渲染出去，
 * 所以 .m-steps 的直接子元素仍然是 .m-step，CSS 一个字都不用改。
 * 要它是因为 provide 只能在组件的 setup 里调，v-for 里没法一项 provide 一份。
 */
const StepSlot = defineComponent({
  name: "MStepSlot",
  props: {
    node: { type: Object as PropType<VNode>, required: true },
    index: { type: Number, required: true },
    count: { type: Number, required: true },
  },
  setup(props) {
    provide(
      stepIndexKey,
      computed<StepIndexContextValue>(() => ({ index: props.index, count: props.count })),
    );
    return () => props.node;
  },
});

/**
 * MSteps 的子节点容器：每次渲染都现摊一遍默认插槽，再给每一项套一层位置上下文。
 *
 * 为什么不在 MSteps 里用 computed 摊：插槽函数本身不是响应式依赖，
 * 父组件换了插槽内容、computed 未必失效，会渲染出上一轮的旧节点。
 * 转发插槽（<slot /> 原样传下来）在 Vue 里是"不稳定"的，所以这个组件每轮都会重渲染，
 * 摊平也就每轮都是新的。
 */
export default defineComponent({
  name: "MStepSlots",
  setup(_, { slots }) {
    return () => {
      const nodes = flattenSteps(slots.default?.());
      return nodes.map((node, index) =>
        h(StepSlot, { key: node.key ?? index, node, index, count: nodes.length }),
      );
    };
  },
});
