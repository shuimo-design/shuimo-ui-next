# shuimo-ui next

水墨风组件库的下一代，**同时支持 Vue 3 和 React**。59 个组件，宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG，仓库里没有一张位图。

**组件文档：<https://shuimo-ui-next.vercel.app>** —— 分成两版，[Vue 版](https://shuimo-ui-next.vercel.app/vue/)和 [React 版](https://shuimo-ui-next.vercel.app/react/)各是一个独立的单框架站：看 React 的人不会在文档里读到 `v-model` 和插槽，Vue 版的页面里也没有一行 React。两边的组件清单、外壳、样式和 API 数据都是同一份，只是各自挑自己那一列。

> 开发中，尚未发布到 npm（当前版本 `0.0.0`）。想试先克隆本仓库跑 `pnpm dev`。

## 三个包，一份实现

| 包                     | 装什么                                                      | 依赖 |
| ---------------------- | ----------------------------------------------------------- | ---- |
| `@shuimo-design/core`  | 全部逻辑、全部样式、水墨引擎。**零框架依赖**的纯 TypeScript | 无   |
| `@shuimo-design/vue`   | Vue 3 的壳：SFC 模板 + 绑定                                 | core |
| `@shuimo-design/react` | React 19 的壳：JSX + 绑定                                   | core |

两个壳里**只有模板结构**。状态机、几何计算、SVG 生成、焦点管理、滚动锁、定位、7000 行 CSS —— 全在 core，只此一份。两边的组件名、prop 名、类名、`data-*` 属性完全对得上，所以同一套样式两边通用。

这条线由机检守着，不靠自觉：

- `pnpm check:arch` —— core 里不许出现任何框架；两边都落地的组件，壳里不许出现 `document.` / `setTimeout` / `ResizeObserver` / `Math.` 之类的 token（出现了就说明有逻辑没下沉）；两个壳的导出必须对得上。
- `pnpm check:style` —— 样式只在 core；core 的 `.ts` 不许 import `.css`（纯 Node 跑服务端渲染时会真的去加载然后崩）；每份样式都必须在 `styles/index.css` 那张清单里。

## 用法

### Vue

```ts
import { createApp } from "vue";
import "@shuimo-design/vue/style.css"; // 样式是单独一个文件，必须显式引
import { createShuimo } from "@shuimo-design/vue";
import { createInkEngine } from "@shuimo-design/core/ink";

createInkEngine(); // 装水墨滤镜；不调用就只有基础层样式，组件照常能用
createApp(App).use(createShuimo()).mount("#app");
```

### React

```tsx
import "@shuimo-design/react/style.css";
import { MButton } from "@shuimo-design/react";
import { createInkEngine } from "@shuimo-design/core/ink";

createInkEngine();
export default () => <MButton type="primary" text="落笔" />;
```

Vue 的 `v-model` 在 React 侧是**受控 / 非受控两套都支持**的一组 prop：`v-model:open` → `open` + `onOpenChange` + `defaultOpen`。具名插槽对应 render prop（`#option` → `renderOption`）。两版文档的 API 表都是从同一份数据生成的，各自只显示自己那一套叫法，照着写即可。

两边都支持服务端渲染（Vue SSR / Next.js）。弹层类组件（对话框、抽屉、浮层、消息）不进服务端 HTML，挂载后才出现 —— 这是两边统一的口径。

Vue 独有的两个入口留着：`@shuimo-design/vue/nuxt`（Nuxt 模块）、`@shuimo-design/vue/resolver`（按需引入）。纯 ESM。

### 关掉水墨皮肤

样式分两层：`m.component` 是骨架（盒模型、间距、状态），`m.ink` 是水墨皮（毛边、笔触、印泥），后者由根元素上的 `m-ink-ready` 类开关。不调 `createInkEngine()` 就只剩骨架；想自己改皮就覆盖 `@layer m.ink`，不用堆选择器抢优先级。

## 开发

需要 Node ≥ 24.11、pnpm ≥ 12。

```bash
pnpm install
pnpm dev          # 起文档站，localhost:5180（/vue/ 和 /react/ 各一版）
pnpm check        # oxlint + oxfmt
pnpm check:arch   # 守住「不重复实现」那条线
pnpm check:style  # 守住「样式只此一份」那条线
pnpm check:ssr    # 纯 Node 里把两边每个组件都渲染一遍（要先 build）
pnpm typecheck    # tsc + vue-tsc，三个包
pnpm test         # vitest 浏览器模式（Chromium），三个包共 681 条
pnpm build        # vp pack 出三个包 + 生成 web-types 和 docs/api/*.json
pnpm bench        # 把笔触 / 落墨样张渲染成图落盘，供人眼检查
```

文档站用 `@shuimo-design/source` 这个自定义 exports 条件直接吃三个包的源码，**clone 下来不用先 build 就能跑**，改库源码也热更新。线上构建走 `dist`，顺带成为产物出口的冒烟测试。

## 目录

```
packages/core/src/
├─ components/       # 每个组件的 types.ts（Props/Emits/Slots，文档的唯一事实来源）
│                    # + index.ts（纯计算与控制器）+ xxx.css
├─ ink/              # 水墨引擎：assets 素材生成器、paper 宣纸、stroke 笔触边框、
│                    # stamp 印章、reveal 擦入、registry 素材登记表
├─ runtime/          # 跨框架原语：Store、observeSize、observeOutside、id
├─ overlay/          # 模态、浮层定位、开合时序、消息队列
├─ context/          # 上下文的「形状」：纯值接口 + 默认值 + 登记表
├─ transition/       # 过渡类名时序 runner（Vue 用原生 Transition，React 用它）
├─ theme/  icons/  styles/
packages/vue/src/    # SFC 壳 + Nuxt 模块 + resolver
packages/react/src/  # JSX 壳
playground/          # 文档站：/ 是分岔口，/vue/ 和 /react/ 各是一个独立应用
├─ src/shared/       # 两版共用：组件清单、API 数据整形、外壳样式
├─ src/vue/          # Vue 版外壳 + 47 个 .vue 示例
└─ src/react/        # React 版外壳 + 47 个 .tsx 示例
notes/               # 方案、写法约定、迁移说明
docs/api/            # 组件 API 元数据（从 core 的类型生成）
```

## 文档

- [notes/PLAN.md](./notes/PLAN.md) — 重写方案、水墨引擎设计、每一轮返工的记录
- [notes/COMPONENT-CONVENTIONS.md](./notes/COMPONENT-CONVENTIONS.md) — 新增组件时照着写
- [notes/MIGRATION.md](./notes/MIGRATION.md) — 从 0.3.x 迁移

## 许可

MIT
