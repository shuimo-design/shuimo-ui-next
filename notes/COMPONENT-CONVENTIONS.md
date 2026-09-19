# 组件写法约定

三个包：`@shuimo-design/core`（纯 TS + 全部样式）、`@shuimo-design/vue`、`@shuimo-design/react`。逻辑写一遍，在 core；壳只有模板和绑定。

## 文件

```
packages/core/src/components/<kebab>/
  types.ts          Props / Emits / Slots 接口，每个字段一行 JSDoc（gen:meta 据此生成 API 文档）
  index.ts          纯函数与控制器：默认值归一化、class 派生、墨迹参数、状态
  <kebab>.css       @layer m.component 结构与默认皮肤；@layer m.ink 仅 html.m-ink-ready 下生效

packages/vue/src/components/<kebab>/
  M<Name>.vue       <script setup lang="ts">，模板 + 绑定 + 生命周期接线
  index.ts          export { default as M<Name> }，类型从 core 转出
  M<Name>.test.ts   vitest browser，vitest-browser-vue 的 render（返回 Promise）

packages/react/src/components/<kebab>/
  M<Name>.tsx
  index.ts          export { M<Name> }，类型从 core 转出
  M<Name>.test.tsx  vitest-browser-react
```

多个组件共用的样式块放 `core/src/internal/`（如 `popper`、`modal-ink`、`tree-row`）。

## 登记

1. `packages/core/src/styles/index.css`：`@import` 新 css。
2. `packages/core/src/styles/manifest.ts`：`COMPONENT_STYLES` 加一项，写自己的 css 名和内部渲染的组件 / 共享块（`renders`）。`style/<Name>` 按需入口从这张表算，漏 `renders` 会让按需引入的用户缺子组件样式。
3. `packages/vue/src/components/index.ts`、`packages/react/src/index.ts`、`packages/vue/src/nuxt/components.ts` 的 `COMPONENT_NAMES`。`gen:meta` 校验三处一致。
4. 有必填 prop 的组件：`scripts/check-ssr.ts` 的 `MINIMAL_PROPS`。
5. 文档站：`playground/src/shared/catalog.ts` 加一项，`playground/src/{vue,react}/demos/<Name>Demo` 各一个。API 表由 `gen:meta` 生成。

## core 与壳的边界

必须在 core：状态机与时序、几何与 SVG 生成、DOM 行为（焦点、滚动锁、定位、拖拽、尺寸监听）、CSS、prop 默认值与归一化、aria 的条件派生、文案、所有数字常量。

可以各写一遍：标签结构、props 声明、响应式桥接的 hook、上下文容器（`provide/inject` 与 `createContext`）、effect 接线、过渡与传送的宿主。

`check:arch` 守这条线：core 不引框架；两边都有的组件，壳里不出现 `document.` / `window.` / `setTimeout` / `addEventListener` / `ResizeObserver` / `getBoundingClientRect` / `Math.`。

## core 的两种形态

- 有状态、驱动渲染：控制器，接口 `{ getSnapshot, getServerSnapshot, subscribe, update, connect, disconnect }`（`runtime/controller.ts`）。`update()` 纯赋值，不通知不碰 DOM；`getServerSnapshot()` 引用恒定、值在服务端可算；`connect/disconnect` 幂等（StrictMode 双调用）。
- 只有副作用：`attach(el) / update(options) / dispose()`，如 `createBrushBorder`、`createParallax`。

props 的纯派生（归一化、过滤、分页折叠、几何）是纯函数，壳在渲染期调（`computed` / `useMemo`），不进控制器。

## SSR

- 服务端输出 = 客户端首帧。依赖 DOM 测量的（笔触边框、毛边色块、笔触线）挂载后再算。
- 渲染路径无 `Math.random()` / `Date.now()`；随机由 `seed` prop 驱动，参考 `MButton` 的 `seed` 默认值 + `useId()`。
- `inkVarBindings()` 显式传 `registered`：SSR 与水合首帧 `false`（内联 style），挂载后 `true`（data 属性）。
- SVG 滤镜 / 渐变 id 用框架的 `useId()` 并过 `sanitizeId()`（React 的 `«r1»` 在选择器里非法）。
- 传送到 body 的浮层服务端不渲染，用"已挂载"闸门。

## 写法

- Vue：`defineOptions({ name })`；props 解构默认值，不用 `withDefaults`；双向绑定用 `defineModel`。
- React：导出名与 Vue 一致；`v-model:x` → `x` / `onXChange` / `defaultX`，受控非受控都支持。
- 只用 `core/src/theme/tokens.css` 的语义变量，不直接用 `--m-color-*`。组件私有变量 `--m-<name>-*`，在根元素声明默认值。
- BEM：`.m-<name>`、`.m-<name>__part`、`.m-<name>--state`。两个壳的类名必须完全相同，class 字符串由 core 的函数派生。
- 形状优先 CSS；只有需要笔触手感的地方用 `core/src/ink/assets` 的 SVG 生成器做 mask。笔触线按实际长度生成，不横向拉伸通用线。
- 生成器里的 `<mask>` / `<filter>` 一律写 `userSpaceOnUse` 按整张画幅算作用范围：默认是被套元素包围盒外扩 10%，化开的边一超出去就被切成方框；样张画在 canvas 上看不出来，页面上做 CSS 遮罩才露。
- 图标从各包的 `icons` 引，几何只在 `core/src/icons/index.ts`。
- 浮层内容传送到 body 后继承不到组件根的 CSS 变量，浮层用到的 `--m-<name>-*` 要在浮层容器上再声明。
- `role` / `aria-*` 完整，键盘可操作，焦点样式用 `:focus-visible`。
- 动效只用 `--m-duration` / `--m-ease`（减弱动效时归零）。
- 不引绘画库。

## 测试

至少：渲染 + 一次交互改变绑定值、禁用不响应、组件特有的键盘行为。两边各一份，断言尽量逐字相同。

```
pnpm -C packages/vue exec vp test src/components/<kebab>
pnpm -C packages/react exec vp test src/components/<kebab>
```

真 Chromium，视口 1280×800（默认 414px 会把横向布局挤出屏幕）。
