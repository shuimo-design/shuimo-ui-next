# shuimo-ui next

水墨风组件库，Vue 3 和 React 共用一套实现。73 个组件；宣纸、远山、毛边、笔触、印章都是运行时生成的 SVG，仓库里没有位图。

文档：<https://shuimo-ui-next.vercel.app>（[Vue](https://shuimo-ui-next.vercel.app/vue/) / [React](https://shuimo-ui-next.vercel.app/react/) 各一版，同一份组件清单和 API 数据，只显示各自的写法）。

当前 `1.0.0-beta.x`，API 可能变，见各包 CHANGELOG。

## 包

| 包                     | 内容                                        | 依赖 |
| ---------------------- | ------------------------------------------- | ---- |
| `@shuimo-design/core`  | 逻辑、样式、墨迹引擎。纯 TS，不依赖任何框架 | —    |
| `@shuimo-design/vue`   | SFC 壳                                      | core |
| `@shuimo-design/react` | JSX 壳                                      | core |

壳里只有模板和绑定。状态机、几何、SVG 生成、焦点、滚动锁、定位、CSS 都在 core。两边组件名、prop 名、类名、`data-*` 一致，样式共用。

两个守卫脚本：

- `check:arch`：core 不引框架；两边都有的组件，壳里不出现 `document.` / `setTimeout` / `ResizeObserver` / `Math.` 等 token；两个壳导出一致。
- `check:style`：CSS 只在 core；core 的 `.ts` 不 import `.css`（Node 里跑 SSR 会炸）；每个 css 都登记在 `styles/index.css` 和 `styles/manifest.ts`。

## 用法

```ts
// Vue
import "@shuimo-design/vue/style.css";
import { createShuimo } from "@shuimo-design/vue";
import { createInkEngine } from "@shuimo-design/vue/ink";

createInkEngine();
createApp(App).use(createShuimo()).mount("#app");
```

```tsx
// React
import "@shuimo-design/react/style.css";
import { MButton } from "@shuimo-design/react";
import { createInkEngine } from "@shuimo-design/react/ink";

createInkEngine();
export default () => <MButton type="primary" text="落笔" />;
```

`createInkEngine()` 装水墨滤镜并给 `<html>` 加 `m-ink-ready`；不调则只有 `@layer m.component` 的骨架样式。要改皮肤，覆盖 `@layer m.ink`。

React 侧 `v-model:x` 对应 `x` / `onXChange` / `defaultX`，受控非受控都支持；具名插槽对应 render prop。SSR 两边都支持；弹层类（对话框、抽屉、浮层、消息）不进服务端 HTML。

Vue 额外有 `@shuimo-design/vue/nuxt` 和 `@shuimo-design/vue/resolver`。纯 ESM。

**按需**。JS：一个源文件一个产物，import 即按需。CSS：整份 `style.css`（22 KB gzip），或按组件引 `style/<Name>` 入口（base + 依赖组件 + 自己的 css，打包器按模块去重），二者选一。Vue 用 `ShuimoResolver({ importStyle: true })`，React 用 vite-plugin-imp，配法见各包 README。

### 印章字体

`MStamp` 用 canvas 量字排版，字体晚到会重排。自备篆体：

```css
@font-face {
  font-family: "MySeal";
  src: url("/fonts/my-seal.woff2") format("woff2");
  font-display: swap;
}
:root {
  --m-font-seal: "MySeal", serif;
}
```

```ts
import { createInkEngine, preloadStampFont } from "@shuimo-design/vue/ink";

createInkEngine();
void preloadStampFont(); // 读 --m-font-seal；子集化字体传 { text: "会用到的字" }
```

单枚覆盖用 `font` prop。字体大就按印文子集化，或加 `<link rel="preload" as="font">`。

## 开发

Node ≥ 24.11，pnpm ≥ 12。

```bash
pnpm install
pnpm dev          # 文档站 localhost:5180，走源码（exports 条件 @shuimo-design/source）
pnpm check        # oxlint + oxfmt
pnpm check:arch
pnpm check:style
pnpm check:ssr    # 纯 Node 渲染全部组件，需要先 build
pnpm typecheck
pnpm test         # vitest 浏览器模式（Chromium），三个包
pnpm build        # vp pack + web-types + docs/api/*.json
pnpm bench        # 笔触 / 落墨样张落盘
```

## 目录

```
packages/core/src/
├─ components/       # <kebab>/types.ts（Props/Emits/Slots，API 文档来源）+ index.ts + <kebab>.css
├─ internal/         # 多个组件共用的样式块
├─ ink/              # assets 素材生成器、paper、stroke、stamp、reveal、registry
├─ runtime/          # Store、observeSize、observeOutside、id
├─ overlay/          # 模态、浮层定位、开合时序、消息队列
├─ context/          # 上下文的纯值接口与默认值
├─ transition/       # 过渡类名时序（React 用；Vue 用原生 Transition）
├─ theme/  icons/  styles/
packages/vue/src/    # SFC 壳 + Nuxt 模块 + resolver
packages/react/src/  # JSX 壳
playground/          # 文档站；src/shared 两版共用，src/vue 与 src/react 各一套外壳和 demo
notes/               # 方案、约定、迁移、缺口清单
docs/api/            # 生成的 API 元数据，不手改
```

- [notes/PLAN.md](./notes/PLAN.md) 方案与决策记录
- [notes/COMPONENT-CONVENTIONS.md](./notes/COMPONENT-CONVENTIONS.md) 新增组件的约定
- [notes/MIGRATION.md](./notes/MIGRATION.md) 从 0.3.x 迁移
- [notes/COMPONENT-GAPS.md](./notes/COMPONENT-GAPS.md) 缺口与排期

## 许可

MIT
