# 组件写法约定

每个组件一个目录 `packages/ui/src/components/<kebab>/`，文件固定：

```
types.ts        Props / Emits / Slots 接口，每个字段一行 JSDoc（gen-meta 会抽成文档）
M<Name>.vue     <script setup lang="ts">，第一行 import "./<kebab>.css"
<kebab>.css     @layer m.component 放结构与默认皮肤；@layer m.ink 放只在 html.m-ink-ready 下生效的水墨效果
index.ts        export { default as M<Name> } from "./M<Name>.vue"; export type * from "./types";
M<Name>.test.ts vitest browser 模式，用 vitest-browser-vue 的 render（返回 Promise，要 await）
```

写法要点：

- `defineOptions({ name: "M<Name>" })`；props 用解构默认值（`const { size = "md" } = defineProps<Props>()`），不用 `withDefaults`。
- 双向绑定一律 `defineModel`；子组件与组的联动用 `provide/inject`，key 放在组件目录的 `context.ts`，类型是 `InjectionKey`。
- 禁用状态经 `useDisabled(() => disabled)`（`src/internal/form-item.ts`）与表单项合并；值变化 / 失焦调 `useFormItem()?.validate("change" | "blur")`。
- 原生可聚焦元素上写 `:id="formItem?.id.value"`，让 `<label for>` 能对上。
- 只用 `src/theme/tokens.css` 里的语义变量，不直接用 `--m-color-*` 传统色。组件私有变量以 `--m-<name>-` 开头并在根元素上声明默认值，方便用户覆盖。
- class 用 BEM：根 `.m-<name>`，子 `.m-<name>__part`，状态 `.m-<name>--state`。
- 形状先用 CSS 画（border-radius / box-shadow / transform：菱形滑钮、实墨块、不规则圆点、双线框），只有要"手感"的地方（笔触线、笔触边框、毛边墨团、一笔写出的箭头）才用 `src/ink/assets` 的 SVG 生成器当 mask。用笔触线时按组件实际长度单独 `brushLineUrl({ length, thickness })` 并写成组件自己的 CSS 变量，不要拿 `--m-ink-line-h` 那条 400px 通用线横向硬压。
- 图标从 `src/icons` 引（每个图标一个 SFC），不内联路径。
- 浮层用 `src/internal/popper/MPopper.vue`：传 `open`、`reference`，它负责定位、传送、淡入和外部点击上报。**浮层内容被 Teleport 到 body，继承不到组件根元素上的 CSS 变量和后代选择器**：浮层用到的 `--m-<name>-*` 变量要在浮层容器上再声明一份，选择器不要写成 `.m-<name> .m-<name>__panel`。
- 无障碍：正确的 `role` / `aria-*`，键盘可操作（空格 / 回车 / 方向键），焦点样式用 `:focus-visible`。
- 动效只用 `--m-duration` / `--m-ease`，减弱动效时它们会自动归零。
- 不引任何绘画库；水墨效果用 CSS / SVG 滤镜（`#m-ink-bleed-light` 等）和 `src/ink` 里的纯算法实现。

测试至少覆盖：渲染 + 一次交互改变 v-model、disabled 不响应、以及组件特有的键盘行为。跑单个目录：`pnpm -C packages/ui exec vp test src/components/<kebab>`。

新组件要登记两处：`src/components/index.ts` 的 `export *` 和 `src/nuxt/components.ts` 的 `COMPONENT_NAMES`（`pnpm gen:meta` 会校验一致）。
