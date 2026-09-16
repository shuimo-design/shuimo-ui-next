/**
 * 服务端渲染冒烟：两个壳的每个组件都在**纯 Node**里渲染一遍（没有 document、没有 window）。
 *
 * 为什么必须单独跑这一条：浏览器里的测试全都有 DOM，任何"在渲染期读 document"的代码
 * 在那儿都活得好好的，只有搬到 Node 上才会炸。以前 MTabs / MCard 就是这么漏出去的。
 *
 * 吃的是 dist（三个包都 build 过之后才跑），所以顺带验证了产物出口和 external 配置：
 * 组件包里要是有哪个 .ts 引了 .css，Node 会真的去加载它然后崩在这一步。
 */
import { createElement, type ComponentType } from "react";
import { renderToString as renderReact } from "react-dom/server";
import { createSSRApp, type Component } from "vue";
import { renderToString as renderVue } from "vue/server-renderer";
import * as ReactPkg from "@shuimo-design/react";
import * as VuePkg from "@shuimo-design/vue";

/**
 * 少数组件没给必填 prop 就会在渲染期抛错（不是服务端渲染的问题，浏览器里也一样）。
 * 这里给它们一份最小可渲染的 props，两个壳共用 —— prop 名本来就是对齐的。
 */
const MINIMAL_PROPS: Record<string, Record<string, unknown>> = {
  MIcon: { name: "close" },
  MNotification: { title: "山水" },
  MSelect: { options: [{ label: "山", value: "shan" }] },
  MStamp: { text: "山水" },
  MTree: { data: [{ key: "1", label: "山" }] },
  MVirtualTree: { data: [{ key: "1", label: "山" }] },
};

/** 必须放在某个父组件里才有意义的子组件：单独渲染本来就该抛错，不是服务端的问题 */
const NEEDS_PARENT = new Set(["MMenuItem"]);

/** 过渡组件要一个被包裹的孩子才谈得上渲染 */
const NEEDS_CHILD = new Set(["MTransition", "MInkTransition"]);

let failed = false;
const fail = (message: string) => {
  console.error(`✗ ${message}`);
  failed = true;
};

/** 导出里以 M 开头、并且真是个组件的那些 */
function components<T>(pkg: Record<string, unknown>, isComponent: (v: unknown) => boolean) {
  return Object.entries(pkg)
    .filter(([name, value]) => /^M[A-Z]/.test(name) && isComponent(value))
    .map(([name, value]) => [name, value as T] as const)
    .sort(([a], [b]) => a.localeCompare(b));
}

const vueComponents = components<Component>(
  VuePkg as unknown as Record<string, unknown>,
  (v) =>
    typeof v === "function" ||
    (typeof v === "object" && v !== null && "render" in v) ||
    (typeof v === "object" && v !== null && "setup" in v),
);
// forwardRef / memo 包出来的是对象不是函数（带 $$typeof 标记），漏掉它们等于白测
const reactComponents = components<ComponentType>(
  ReactPkg as unknown as Record<string, unknown>,
  (v) =>
    typeof v === "function" ||
    (typeof v === "object" && v !== null && "$$typeof" in (v as Record<string, unknown>)),
);

let vueOk = 0;
for (const [name, component] of vueComponents) {
  if (NEEDS_PARENT.has(name)) continue;
  try {
    await renderVue(createSSRApp(component, MINIMAL_PROPS[name]));
    vueOk++;
  } catch (error) {
    fail(`Vue ${name} 服务端渲染抛错：${(error as Error).message}`);
  }
}

let reactOk = 0;
for (const [name, component] of reactComponents) {
  if (NEEDS_PARENT.has(name)) continue;
  try {
    const props: Record<string, unknown> = { ...MINIMAL_PROPS[name] };
    if (NEEDS_CHILD.has(name)) props.children = createElement("div");
    renderReact(createElement(component, props));
    reactOk++;
  } catch (error) {
    fail(`React ${name} 服务端渲染抛错：${(error as Error).message}`);
  }
}

// 真有 document 的话这条冒烟就没意义了，直接报出来
if (typeof globalThis.document !== "undefined") fail("这个环境里有 document，测不出服务端的问题");

console.log(
  failed
    ? "ssr check failed"
    : `ssr check passed：Vue ${vueOk} 个组件、React ${reactOk} 个组件在纯 Node 里都渲染通过`,
);
process.exit(failed ? 1 : 0);
