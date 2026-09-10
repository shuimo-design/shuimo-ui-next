# shuimo-ui next

水墨风 Vue 组件库的下一代。59 个组件，宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG，仓库里没有一张位图。

**组件文档（演练场）：<https://shuimo-ui-next.vercel.app>**

> 开发中，尚未发布到 npm（当前版本 `0.0.0`）。想试先克隆本仓库跑 `pnpm dev`。

## 和旧版 shuimo-ui 的区别

- **单包**：`@shuimo-design/ui` 一个包装完，不再分 core / vue / theme。
- **SFC**：组件是 Vue 3.5 单文件组件，props / emits / slots 的类型写在同目录 `types.ts` 上，IDE 提示和文档 API 表共用同一份 JSDoc。
- **水墨改成算出来的**：所有纹理和笔触是运行时生成的 SVG，给定 seed 可复现，暗色主题下自动换调子，不再有需要 `invert(1)` 的贴图。
- **双向绑定统一 `v-model`**：旧的 `visible` / `checked` / `isActive` 这类各自为政的开关 prop 都并进去了。

破坏性改动逐条见 [docs/MIGRATION.md](./docs/MIGRATION.md)。

## 用法

```ts
import { createApp } from "vue";
// 样式被抽成单独一个文件，必须显式引入
import "@shuimo-design/ui/style.css";
import { createShuimo } from "@shuimo-design/ui";
import { createInkEngine } from "@shuimo-design/ui/ink";

// 装水墨滤镜；不调用就只有基础层样式，组件照常能用
createInkEngine();
createApp(App).use(createShuimo()).mount("#app");
```

四个入口：`.` 组件、`./ink` 水墨引擎、`./nuxt` Nuxt 模块、`./resolver` 按需引入。纯 ESM。

### 关掉水墨皮肤

样式分两层：`m.component` 是骨架（盒模型、间距、状态），`m.ink` 是水墨皮（毛边、笔触、印泥），后者由根元素上的 `m-ink-ready` 类开关。不调 `createInkEngine()` 就只剩骨架；想自己改皮就覆盖 `@layer m.ink`，不用堆选择器抢优先级。

## 开发

需要 Node ≥ 24.11、pnpm ≥ 12。

```bash
pnpm install
pnpm dev          # 起演练场（也就是文档站），localhost:5180
pnpm check        # oxlint + oxfmt
pnpm typecheck    # vue-tsc
pnpm test         # vitest 浏览器模式（Chromium），364 条
pnpm build        # vp pack 出库 + 生成 web-types 和 docs/api/*.json + 样式约定检查
pnpm bench        # 把笔触 / 落墨样张渲染成图落盘，供人眼检查
```

演练场吃的是 `packages/ui/dist`，所以改完库要先 `pnpm build` 再看效果。

## 目录

```
packages/ui/src/
├─ components/       # 47 个目录 / 59 个组件：MXxx.vue + xxx.css + types.ts + MXxx.test.ts
├─ ink/              # 水墨引擎：assets 素材生成器、paper 宣纸、stroke 笔触边框、
│                    # stamp 印章、reveal 擦入、registry 素材登记表
├─ theme/            # 传统色、语义 token、@layer 声明
├─ icons/  internal/  nuxt/  resolver.ts
playground/          # 演练场，每个组件一页，页底自动渲染 API 表
docs/                # 方案、写法约定、迁移说明、组件 API 元数据
```

## 文档

- [docs/PLAN.md](./docs/PLAN.md) — 重写方案、水墨引擎设计、每一轮返工的记录
- [docs/COMPONENT-CONVENTIONS.md](./docs/COMPONENT-CONVENTIONS.md) — 新增组件时照着写
- [docs/MIGRATION.md](./docs/MIGRATION.md) — 从 0.3.x 迁移

## 许可

MIT
