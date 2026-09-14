# 组件写法约定

这个库拆成三个包：`@shuimo-design/core`（纯 TS + 全部样式，零框架依赖）、`@shuimo-design/vue`、`@shuimo-design/react`。**一个组件的逻辑只写一遍，写在 core；两个壳只写模板和绑定。**

## 一个组件涉及的文件

```
packages/core/src/components/<kebab>/
  types.ts        Props / Emits / Slots 接口，每个字段一行 JSDoc（生成 API 文档用）
  index.ts        无框架部分：默认值归一化、class 派生、墨迹参数、状态控制器
  <kebab>.css     @layer m.component 放结构与默认皮肤；@layer m.ink 放只在 html.m-ink-ready 下生效的水墨效果

packages/vue/src/components/<kebab>/
  M<Name>.vue     <script setup lang="ts">，只有模板 + 绑定 + 生命周期接线
  index.ts        export { default as M<Name> }；类型从 core 转出去
  M<Name>.test.ts vitest browser 模式，用 vitest-browser-vue 的 render（返回 Promise，要 await）

packages/react/src/components/<kebab>/
  M<Name>.tsx     同一个组件的 JSX 版
  index.ts        export { M<Name> }；类型同样从 core 转出去
  M<Name>.test.tsx vitest browser 模式，用 vitest-browser-react
```

新组件的 CSS 要往 `packages/core/src/styles/index.css` 的清单里加一行，`check-style.ts` 会校验一个都不漏。同时在 `packages/core/src/styles/manifest.ts` 的 `COMPONENT_STYLES` 里登记：自己的 css 文件名，以及它内部会渲染哪些别的组件（`renders`）—— 按需入口 `style/<组件名>` 就是从这张表算的，漏写 `renders` 的后果是用户按需引入时子组件裸奔。

## 哪些东西必须在 core

**不允许在两个壳里各写一遍的**：任何状态机和时序、几何与 SVG 生成、DOM 行为（焦点、滚动锁、定位、拖拽、尺寸监听）、CSS、prop 默认值与归一化、aria 的条件派生、文案、以及任何数字（分桶大小、动画时长、缓动曲线）。

**允许各写一遍的**：模板 / JSX 的标签结构、props 的声明方式、响应式桥接的那几行 hook、上下文容器（`provide/inject` 对 `createContext`）、effect 接线、过渡与传送的宿主。

`scripts/check-architecture.ts` 会机检这条线：core 里不许出现任何框架；两边都已落地的组件，壳里不许出现 `document.` / `window.` / `setTimeout` / `addEventListener` / `ResizeObserver` / `getBoundingClientRect` / `Math.` 这些 token。想违反的地方，说明那段逻辑应该下沉。

## core 里的两种写法

- **有状态、要驱动渲染的**：写成控制器，形状统一是 `{ getSnapshot, getServerSnapshot, subscribe, update, connect, disconnect }`（见 `runtime/controller.ts`）。三条铁律：`update()` 是纯赋值（不通知、不碰 DOM），`getServerSnapshot()` 的引用恒定且值是服务端也算得出来的，`connect/disconnect` 幂等可反复配对（React 的 StrictMode 会跑两轮）。
- **只有副作用、没有状态的**：写成 `attach(el) / update(options) / dispose()`，像 `createBrushBorder` 和 `createParallax`。

props 的纯派生（选项归一化、过滤、页码折叠、几何计算）一律做成纯函数，不进控制器——由壳在渲染期调（Vue 的 `computed` / React 的 `useMemo`）。

## 服务端渲染的规矩

两个框架都要能服务端渲染，所以：

- **渲染期的输出，服务端和客户端首帧必须一致。** 要量 DOM 才知道的东西（笔触边框、毛边色块、笔触线）一律挂载后再算，首帧渲染朴素版。
- **渲染路径上不许出现 `Math.random()` / `Date.now()`**，随机一律由 `seed` prop 驱动。`MButton` 的 `seed` 默认值 + `useId()` 就是正确范式。
- `inkVarBindings()` 要显式传 `registered`：服务端和水合首帧传 `false`（内联 style），挂载后才传 `true`（升级成 data 属性）。不传的话两边输出对不上，水合会报属性不匹配。
- SVG 滤镜 / 渐变的 id 用各框架自己的 `useId()` 生成，穿过 core 的 `sanitizeId()`（React 的 `«r1»` 在 CSS 选择器里是非法的）。
- 传送到 body 的浮层在服务端一律不渲染，两边各用一个"已挂载"闸门挡住。

## 写法要点

- Vue：`defineOptions({ name: "M<Name>" })`；props 用解构默认值，不用 `withDefaults`；双向绑定一律 `defineModel`。
- React：导出名和 Vue 一致（都叫 `MDialog`）；`v-model:x` 对应 `x` + `onXChange` + `defaultX`，受控非受控都支持。
- 只用 `core/src/theme/tokens.css` 里的语义变量，不直接用 `--m-color-*` 传统色。组件私有变量以 `--m-<name>-` 开头并在根元素上声明默认值。
- class 用 BEM：根 `.m-<name>`，子 `.m-<name>__part`，状态 `.m-<name>--state`。**两个壳必须产出完全相同的类名**，7000 行 CSS 才能共用。
- 形状先用 CSS 画（border-radius / box-shadow / transform），只有要"手感"的地方（笔触线、笔触边框、毛边墨团、一笔写出的箭头）才用 `core/src/ink/assets` 的 SVG 生成器当 mask。用笔触线时按组件实际长度单独生成，不要拿通用线横向硬压。
- 图标从各自包的 `icons` 引；几何数据在 `core/src/icons/index.ts` 里只有一份，不要在壳里内联路径。
- 浮层用内部的 popper 原语：**浮层内容被传送到 body，继承不到组件根元素上的 CSS 变量和后代选择器**，浮层用到的 `--m-<name>-*` 要在浮层容器上再声明一份。
- 无障碍：正确的 `role` / `aria-*`，键盘可操作，焦点样式用 `:focus-visible`。
- 动效只用 `--m-duration` / `--m-ease`，减弱动效时它们会自动归零。
- 不引任何绘画库；水墨效果用 CSS / SVG 滤镜和 `core/src/ink` 里的纯算法实现。

## 测试

至少覆盖：渲染 + 一次交互改变绑定值、禁用时不响应、以及组件特有的键盘行为。两边各写一份，断言部分尽量逐字一致。

```
pnpm -C packages/vue exec vp test src/components/<kebab>
pnpm -C packages/react exec vp test src/components/<kebab>
```

浏览器测试跑在真 Chromium 里（滤镜、mask、ResizeObserver 在 happy-dom 里测不了），视口是 1280×800——默认的 414px 会把横向排布的组件挤出屏幕，点不到。

## 登记

新组件要登记三处：`packages/vue/src/components/index.ts`、`packages/react/src/index.ts`，以及 `packages/vue/src/nuxt/components.ts` 的 `COMPONENT_NAMES`（`pnpm gen:meta` 会校验一致）。
