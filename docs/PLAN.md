# shuimo-ui next — 重写方案

日期：2026-09-08
已拍板：新仓库从零写 · SFC · 单包 · 41 个组件全部重做 · 允许 breaking

---

## 0. 先说前置阻塞（动手前要定）

| 事项                   | 现状                                                                                                  | 需要决定                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| npm 包名               | `shuimo-ui` 归 higuaifan（主作者，1228 次提交）；你是 shuimo-design 组织成员                          | 用 `shuimo-ui@2` 需要他给发布权；否则用新名 `@shuimo-design/ui` 或 `@jobinjia/shuimo-ui` |
| 域名                   | `shuimo.design` 由旧站自托管（Nitro node server，浙 ICP 备案）                                        | next 文档站部署到哪：同域子路径 / `next.shuimo.design` / 先 Vercel                       |
| 手写字体 wljh          | 旧仓库直接提交 20.7MB TTF，未见授权说明                                                               | 确认可商用/可再分发；不确定就只做子集化的 woff2 且不入 npm 包                            |
| shuimo-core 体积与性能 | 未实测：一张 3000×800 山水的 SVG 生成耗时、SVG 节点数、`xuan-paper` worker 耗时都没有数字             | 第一周先做 benchmark，数字决定"实时生成"还是"构建期预生成 + 运行期只做视差"              |
| Safari 兼容            | 旧站的 `-webkit-box-reflect`、新方案里的 scroll-driven animation、View Transitions 在 Safari 覆盖不齐 | 目标浏览器定为 Chrome/Edge 120+、Safari 17+、Firefox 128+，缺的能力做渐进降级            |

**后续结论（2026-09-10）**：

- 包名取 `@shuimo-design/ui`，不去争 `shuimo-ui`。尚未发布 npm（当前 `0.0.0`）。
- 仓库定为 `shuimo-design/shuimo-ui-next`（公开）。文档站先上 Vercel，见文末「仓库与部署」。
- shuimo-core 的体积与性能不用再测：整个依赖已移除，素材改成本仓库自己生成，见 §4。
- 手写字体 wljh **仍未解决**：`--m-font-brush: "wljh"` 没有对应 `@font-face`，本机没装就退回黑体。授权与子集化都没做。

---

## 1. 目标

1. 技术栈全部拉到当前最新（下表），工具链统一到 Vite+（`vp`），和你 shuimo-core 仓库一致。
2. 把"水墨感"从美工切图改成程序化生成：宣纸、远山、墨晕、笔触、印章都由 `@jobinjia/shuimo-core` 和 SVG 滤镜实时产出，seed 可复现。
3. 首屏预算：HTML < 50KB，首屏 JS < 150KB gzip，特效引擎按需懒加载，不再有 base64 大图。
4. 交付质量：真 d.ts、web-types 自动生成、视觉回归截图、changesets 发版、PR CI。

---

## 2. 技术栈（2026-09-08 npm 最新）

| 层         | 选型                                     | 版本                    | 说明                                                                                                                                                                 |
| ---------- | ---------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 框架       | vue                                      | 3.5.42                  | SFC + `<script setup lang="ts">` + `defineModel` / props 解构                                                                                                        |
| 工具链     | vite-plus (`vp`)                         | 0.3.0                   | 内含 vite 8 / vitest 5 / oxlint / oxfmt / tsdown；`vp pack` 出库、`vp test`、`vp check`                                                                              |
| 语言       | typescript                               | 5.9.3                   | **实测**：vue-tsc 3.3.11 找 `typescript/lib/tsc`，TS 7（Go 版）没有这个入口，起不来；tsdown 的 `dts.vue` 也走 vue-tsc。整个工作区锁 5.9.x，等 vue-tsc 支持 TS 7 再升 |
| 类型产出   | vue-tsc                                  | 3.3.11                  | `vue-tsc --declaration` 产出 SFC 的 d.ts，交给 tsdown dts 合并                                                                                                       |
| API 元数据 | vue-component-meta                       | 3.3.11                  | 从 SFC 直接提取 props/emits/slots，生成 web-types.json 和文档 API 表，替代 jh-api                                                                                    |
| 定位       | @floating-ui/vue                         | 2.0.1                   | Popover / Tooltip / Select 下拉                                                                                                                                      |
| 通用 hooks | @vueuse/core                             | 14.4.0                  | 替换旧仓库手抄的 debounce/throttle/resize/eventListener                                                                                                              |
| 特效内核   | @jobinjia/shuimo-core                    | 2.0.3                   | 山水 / 花鸟 / 印章 / 宣纸 worker / WASM 噪声                                                                                                                         |
| 字体       | @jobinjia/vite-plugin-shuimo-font-subset | 1.0.0                   | 构建期按内容子集化 woff2                                                                                                                                             |
| 文档站     | nuxt + @nuxt/content + @nuxtjs/i18n      | 4.5.2 / 3.16.0 / 10.6.0 | 替换自 fork 的 markdown 插件；demo 用 Nuxt Content 的 MDC 组件嵌入                                                                                                   |
| 测试       | vitest 4 browser mode + @playwright/test | 4.1.11 / 1.63.0         | vitest 版本由 vite-plus 0.3.0 内置决定，不能单独升 5；组件测试跑在真 Chromium（滤镜、canvas 在 happy-dom 里测不了）；Playwright 做截图回归                           |
| 发版       | @changesets/cli                          | 3.0.2                   | 版本 + CHANGELOG + GitHub Release                                                                                                                                    |
| 包管理     | pnpm                                     | 12.3.4                  | lockfile 入库，`packageManager` 字段锁死                                                                                                                             |
| Node       | 24 LTS                                   |                         | CI 与本地一致                                                                                                                                                        |

明确不带：Sass/Less（原生 CSS 嵌套 + lightningcss 由 vite 8 内置）、janghood 全家桶、interactjs（Message 拖拽用 pointer events 自己写 60 行）、dayjs（DatePicker 用 `Temporal` polyfill 或 `Intl` + 原生 Date；不引入库）。

---

## 3. 仓库与目录

```
shuimo-ui-next/                      # github.com/shuimo-design/shuimo-ui-next（公开）
├─ package.json                      # private，workspace 根；scripts 全走 vp
├─ pnpm-workspace.yaml               # catalog 锁 vite / vitest / vite-plus，与 shuimo-core 同写法
├─ vite.config.ts                    # vp 的 fmt / lint 根配置
├─ .changeset/
├─ .github/workflows/
│   ├─ ci.yml                        # PR：install → vp check → typecheck → vp test → build → attw
│   ├─ release.yml                   # main：changesets publish
│   └─ deploy.yml                    # main：Vercel CLI 部署演练场（要 VERCEL_TOKEN，没配就跳过）
├─ vercel.json                       # 构建先出库再打演练场，产物取 playground/dist
├─ packages/
│   └─ ui/                           # 唯一发布的包（名字见阻塞项）
│       ├─ package.json              # exports: ".", "./style.css", "./ink", "./nuxt", "./resolver"（产物 .js/.d.ts，ESM only）（产物 .js/.d.ts，ESM only）
│       ├─ vite.config.ts            # vp pack: entry {index, ink, nuxt, resolver}; format esm; dts
│       ├─ src/
│       │   ├─ index.ts              # 全量导出 + install()
│       │   ├─ components/           # 见 §5，每组件一目录
│       │   │   └─ button/
│       │   │       ├─ MButton.vue
│       │   │       ├─ button.css    # 组件样式，@layer m.component
│       │   │       ├─ types.ts      # props/emits/slots 类型（带 JSDoc，供 vue-component-meta）
│       │   │       ├─ index.ts
│       │   │       └─ MButton.test.ts   # vitest browser mode
│       │   ├─ composables/          # useInk*, usePopper, useModel, useDark …
│       │   ├─ ink/                  # 特效引擎，见 §4；可单独 import
│       │   ├─ theme/
│       │   │   ├─ tokens.css        # --m-* 语义 token，light/dark
│       │   │   ├─ colors.css        # 45 个中国传统色（原样继承）+ 五行别名
│       │   │   └─ layers.css        # @layer m.reset, m.tokens, m.base, m.component, m.ink
│       │   ├─ directives/           # v-loading, v-ink（给任意元素挂墨晕）
│       │   ├─ nuxt/                 # Nuxt 模块：addComponent 显式清单 + css 注入 + ink 引擎 client-only
│       │   ├─ resolver.ts           # unplugin-vue-components 的 resolver，非 Nuxt 项目按需引入
│       │   └─ style.css             # 全量样式入口
│       ├─ scripts/
│       │   └─ gen-meta.ts           # vue-component-meta → web-types.json + docs/api/*.json
│       └─ e2e/                      # Playwright 截图回归，按组件 × light/dark × reduced-motion
├─ playground/                       # 演练场：每组件一页 + 页底 API 表；现在**就是文档站**，发在 Vercel
├─ docs/                             # Nuxt 4 + Content 文档站（**只有空壳**，正文还没写，见 §7）
│   ├─ api/*.json                    # gen-meta 产出的组件 API 元数据，演练场直接读
│   ├─ COMPONENT-CONVENTIONS.md      # 新增组件的写法约定
│   └─ MIGRATION.md                  # 从 0.3.x 迁移
└─ docs/PLAN.md                      # 本文
```

单包但两个入口：`.` 是组件，`./ink` 是特效引擎。组件默认自带水墨皮肤；想要"无皮肤"用 CSS layer：`@import "shuimo-ui/style.css" layer(m)` 后用户自己 `@layer m.ink { }` 覆盖，或者根本不引 `m.ink` 层。这就是 headless 的替代，不再维护第二套组件。

---

## 4. 特效引擎 `src/ink/`（这次的核心）

> **2026-09-08 决定：彻底移除 `@jobinjia/shuimo-core`**（用户原话「shuimo-core 的移除掉吧」）。本节后面关于宣纸 worker、山水分层、Brush 笔触、fontkit 打包的内容保留作历史记录，现状是：
>
> - 宣纸 `ink/paper`：一张 384px 可平铺 SVG 纹理（`feTurbulence stitchTiles` + 颗粒 / 纤维两层 multiply + 可选洒金），当 `background-image` 用，浏览器光栅化一次即缓存；毛边是 `preserveAspectRatio=none` 的位移遮罩。不再有 canvas、worker、WASM。
> - 山水 `ink/landscape`、视差层、`inkWorkersKey`、`paper-worker.js` / `landscape-worker.js` 产物、fontkit 桩、三个 shuimo-core 基准脚本：全部删除（源码已挪到会话 scratchpad）。MRicePaper 只剩 `seed / tier / paper / grain / goldFlecks / deckleEdge`。
> - 笔触 `ink/stroke`：自写变宽多边形 —— 中心线加手抖，宽度轮廓起笔按、收笔收，拆成 4 条纵向墨带，外侧墨带按飞白概率沿绝对长度断开（约 30px 一个起伏），再套原有的 feTurbulence 晕染滤镜；SMIL 描出保留。随机数用 `ink/random.ts` 的 mulberry32 + 一维平滑噪声。
> - `ink/parallax`、`bleed`、`reveal`、`transition` 本来就不依赖它，原样保留。
> - vite 配置回到最简：没有 alias / alwaysBundle / worker 入口。`pnpm bench` 只剩把样张渲染成图的脚本。

原则：**能用 CSS/SVG 滤镜就不用 canvas，能用 canvas 就不用 WebGPU；一切带 seed，一切尊重 `prefers-reduced-motion`，一切按需加载。**

| 模块         | 做什么                   | 实现                                                                                                                                                                                                                             | 替代旧仓库的                            |
| ------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `paper`      | 宣纸纹理                 | shuimo-core `xuan-paper/worker` 在 Web Worker 里生成一张 512×512 可平铺纹理 → `OffscreenCanvas` → `ImageBitmap` → 通过 `CSS.paintWorklet` 或 `background-image: url(blob:)` 贴到 `--m-paper`。冷/暖两色由 token 控制，不再两张图 | 578×578 webp × 2                        |
| `landscape`  | 远山、近山、水面         | `generateLandscape({ seed, width, height, transparent: true })` 产 SVG，按 z 深度拆成 4 层 `<g>`（利用 MountPlanner 的分层信息）；每层各自 `will-change: transform`                                                              | 8 张 webp × 明暗 2 套 = 2.3MB           |
| `parallax`   | 鼠标 / 陀螺仪 / 滚动视差 | rAF + 阻尼插值（lerp 0.08），`pointermove` 只写目标值；滚动用 `animation-timeline: scroll()`，Safari 降级为 rAF 读 `scrollY`                                                                                                     | mousemove 直接 translate，无缓动        |
| `bleed`      | 墨晕滤镜                 | 全局注入一次 `<svg><filter id="m-ink-bleed">feTurbulence + feDisplacementMap + feGaussianBlur</filter>`，组件用 `filter: url(#m-ink-bleed)`；参数（baseFrequency / scale）走 CSS 变量，`--m-ink-strength: 0` 即关闭              | `.m-marker` 上那一处 blur + drop-shadow |
| `stroke`     | 笔触边框                 | shuimo-core `drawing/Brush` 按元素尺寸生成四条笔触 path，`ResizeObserver` 触发；按尺寸桶（每 8px 一档）缓存 SVG 字符串，作为 `border-image-source: url("data:image/svg+xml,…")` 或 `mask-image`                                  | `border-image: webp`                    |
| `stamp`      | 印章                     | `generateStamp({ text, type, shape })` → `<MStamp>` 组件；Confirm 的确定按钮、Message 的 success 图标、文档站页脚落款都用它                                                                                                      | 无                                      |
| `reveal`     | 落墨动画                 | shuimo-core `Experimental` 的 stroke animation：路径按笔顺 `stroke-dasharray` 揭示；用于 Loading、页面标题、MBorder 首次出现                                                                                                     | `@keyframes m-rotate`                   |
| `transition` | 路由 / 弹层转场          | View Transitions API，`::view-transition-new(root)` 用 `mask-image` 做墨迹晕开（mask 是 `bleed` 滤镜产的一张噪声 PNG）；Dialog/Drawer 用同一套 mask 做 enter/leave                                                               | 0.8s 横向滑动                           |
| `cursor`     | 毛笔光标                 | 保留旧仓库三张 1–2KB webp，做成 token `--m-cursor-*`                                                                                                                                                                             | 同                                      |
| `perf`       | 分级                     | `navigator.hardwareConcurrency`、`deviceMemory`、`prefers-reduced-motion`、`saveData` 综合成 `tier: 0                                                                                                                            | 1                                       | 2`：0 = 静态纯色纸 + 无视差，1 = SVG 山 + 视差，2 = 全部滤镜 + 落墨动画。用户可 `MConfigProvider :ink-tier` 强制 | 无  |

加载策略：`shuimo-ui` 主入口不 import shuimo-core。`MRicePaper` 挂载后 `import('shuimo-ui/ink')` 再 `import('@jobinjia/shuimo-core/elements')`，SSR 阶段输出纯色纸 + 占位，水合后再上山。WASM 噪声只在 tier 2 且支持时加载。

### benchmark 结果（2026-09-08，M 系列 Mac，Node 24，`pnpm bench 10`）

| 尺寸             | 生成 P50 | 生成 P95 | SVG 大小 | 元素               |
| ---------------- | -------- | -------- | -------- | ------------------ |
| hero 1920×600    | 137 ms   | 167 ms   | 6.9 MB   | 22,780 条 polyline |
| default 3000×800 | 154 ms   | 226 ms   | 8.1 MB   | 同量级             |
| mobile 800×500   | 76 ms    | 97 ms    | 3.9 MB   | 同量级             |

结论：

- **生成耗时可以接受**（放进 Worker 里 150ms 无感），实时生成路线成立。
- **SVG 字符串绝不能直接进 DOM**：两万多条 polyline、7MB 文本，视差时每帧重排会卡死。`landscape` 模块必须把 SVG 光栅化：`Path2D` + `OffscreenCanvas` 在 Worker 里逐层画成 `ImageBitmap`，主线程只做 4 张位图的 transform。shuimo-core 输出里已带 `data-shuimo-element` / `data-shuimo-layer` 属性，按它拆层。
- 移动端优先走低细节参数（`detail` < 1），还需要再测一轮细节参数对 polyline 数量的影响。
- `xuan-paper` worker 的耗时见下一节。

### paper 模块的 worker 打包方式（已验证，2026-09-08）

- `src/ink/paper/worker.ts` 只有一行 `import "@jobinjia/shuimo-core/xuan-paper/worker"`；pack 里单独作为 `paper-worker` 入口，并用 `deps.alwaysBundle` 把 shuimo-core 的这个子路径（含内嵌 WASM）打进去，产出自包含的 `dist/paper-worker.js`（196KB，gzip 73KB），没有裸包名 import。
- 主线程用 `new Worker(new URL("./paper-worker.js", import.meta.url), { type: "module" })` 引用；路径字符串放在变量里，避免 tsdown 把它当静态资源解析。playground `vp build` 已验证消费者的 Vite 能识别并单独产出 `paper.worker-*.js`。
- 测试环境跑的是源码，没有 dist，所以 `createPaperRenderer({ createWorker })` 允许注入工厂，测试用 Vite 的 `./worker?worker` 语法。
- Vite dev 下必须把 `@jobinjia/shuimo-core/xuan-paper/worker` 加进 `optimizeDeps.include`，否则第一次加载触发依赖重优化会把 worker 杀掉（表现为 "paper worker crashed"）。这条要写进 Nuxt 模块和 Vite 插件里替用户配好。
- 不支持 OffscreenCanvas 的浏览器回退到主线程 `xuanPaper()`，但那会动态加载整个 shuimo-core（573KB）；后续改成只引 `elements` 子路径。

### 山水 SVG 光栅化基准（2026-09-08，Chromium headless，1920×600）

| 方案                                               | 生成   | 光栅化              | SVG    | polyline |
| -------------------------------------------------- | ------ | ------------------- | ------ | -------- |
| detail 1 · 主线程 Image 解码                       | 145 ms | 233 ms              | 7.1 MB | 22,780   |
| detail 0.5 · 主线程 Image 解码                     | 128 ms | 209 ms              | 6.9 MB | 21,630   |
| detail 0.25 · 主线程 Image 解码                    | 101 ms | 192 ms              | 6.2 MB | 19,335   |
| 任意 detail · Worker `createImageBitmap(svg blob)` | —      | **Chromium 不支持** | —      | —        |
| 移动端 800×500 detail 0.5                          | 55 ms  | 106 ms              | 3.5 MB | 11,605   |

结论：

- `detail` 不是降折线数的杠杆（只减 15%），折线主力不在山体皴纹；缩小画幅才有效。
- Worker 里没法把 SVG 转位图，所以 `landscape` 模块的分工定为：**Worker 生成 + 按深度拆成多份 SVG 文档 → 主线程 `Image.decode()` 并行解码 → 每层一个 ImageBitmap**。首屏一次约 150ms（后台）+ 230ms（解码，异步不阻塞主线程脚本）。
- 分层用 `SceneManager` 的 chunk `y` 分位数分桶（shuimo-core 的 `generatePainting` 是私有拼装拿不到分层），代价是暂时没有 `blankPosition` / `detail`。**shuimo-core 待办：导出 `generateLandscapeLayers`**。
- 分层后各层必须以 `mix-blend-mode: multiply` 叠在宣纸上（山体白色遮挡多边形靠 multiply 变透明），近景山不再遮挡远景线条，这是视差分层的固有代价，与旧站分层 webp 一致。

### 打包与确定性上踩到的坑（2026-09-08，已解决）

- tsdown 的外部化规则（三条都实测过）：① package.json 声明过的依赖默认外部，只有 `alwaysBundle`（函数形式，按 importer 判断是不是 worker 源码）能覆盖它，所以 shuimo-core 靠这条进 worker；② `neverBundle` 必须写显式数组——写 `true` 会把未声明的 fontkit 直接外部化、不经过 alias，写函数会让 dts 插件丢掉入口名（`ink.d.ts` 变成 `index2.d.ts`），且显式数组里的包 `alwaysBundle` 覆盖不了；③ 数组之外的包正常解析，fontkit 用 `alias` 指到空模块。产物 `landscape-worker.js` 176KB、共享 `model-*.js` 198KB，零裸包名 import。
- shuimo-core 的 Perlin 噪声表在第一次调用时才从 prng 取 4096 个数填充，所以 `prng.seed()` 之后"首次"与"之后"结果不同，且依赖历史 seed；`generateLandscape` 本身同 seed 两次也不一致。ui 侧在 `prng.seed(seed)` 后显式 `noise.reset()` 解决。**shuimo-core 待办：`generatePainting` 内部做同样处理。**
- **组件 CSS 必须从 SFC 自己 `import`，不能放在 `components/<name>/index.ts` 这种纯转发文件里**：package.json 的 `sideEffects: ["**/*.css"]` 让 rolldown（1.2.7）把只含 `export ... from` 的 barrel 视为无副作用并整个跳过，里面的 `import "./x.css"` 一起丢掉，`dist/style.css` 就少了整块组件样式（2026-09-08 在 playground 里发现：整页无样式，canvas 进文档流把容器越撑越大到 1600 万像素高，宣纸 `transferToImageBitmap` 因超过 canvas 上限报错）。去掉 `sideEffects` 声明也能修，但那会让使用方的打包器丢掉 `style.css`，所以保留声明、改引入位置。构建后 `scripts/check-style.ts` 会校验每个 css 文件的首个类名都在 `dist/style.css` 里。
- 打包产物里 JS 不再带任何 CSS，使用方必须显式 `import "@shuimo-design/ui/style.css"`（Nuxt 模块已自动注入）；playground 也一样。
- MRicePaper 的位图有总像素预算 800 万、单边 8192，并在 worker 失败时退成纯色纸；ResizeObserver 只在 CSS 尺寸真的变化时才重画。
- Chromium 的 `createImageBitmap` 不接受 SVG blob，worker 里无法光栅化 SVG；rolldown 也不认 `?worker`，所以 worker 引用统一用 `new URL(变量, import.meta.url)`。

### stroke 模块（笔触边框，2026-09-08）

- 实现：`ink/stroke/generate.ts` 沿矩形四边各走一笔 `naturalBrushStroke`（或 shan-shui `stroke()`），画黑、拼成 SVG，内嵌一层 feTurbulence 位移 + 微模糊做晕染；`useBrushBorder(el)` 监听尺寸、8px 分桶缓存、写入 `--m-ink-stroke-border`（data URL）和 `--m-ink-stroke-pad`；`stroke.css` 用 `::before` 外扩 pad、以该 SVG 作 `mask-image`、底色 `--m-ink`，所以墨色跟主题走、暗色自动成立。生成 800×400 一张 < 50ms，主线程同步即可。
- 体积：生成器是懒加载 chunk，消费者侧 145KB（gzip 63KB），大头是 shuimo-core 内嵌的噪声 WASM base64（118KB）。
- **shuimo-core bug（待上游修）**：`Brush.stroke` 对相邻两段方向角做算术平均，向左的笔画方向角在 ±π 附近平均成 0，法线翻转，画出串珠伪影。ui 侧规避：四条边一律向右/向下画。
- shan-shui `stroke()` 默认宽度函数是 `sin` 梭形，边框场景要传接近匀宽的 `fun`。

### reveal / transition 模块（落墨与转场，2026-09-08）

- **通用擦入** `ink/reveal`：一张 2:1 的 SVG 遮罩（左黑右透明，分界线经 feTurbulence 位移 + 微模糊成毛边），`mask-size: 200%`，用 WAAPI 把 `mask-position` 从 100% 扫到 0%。`revealElement(el)`、`useInkReveal`、`v-ink-reveal` 指令；`reverse` 反向擦掉；动画期间才挂遮罩，结束即清理；`pseudoElement` 可作用在 `::before`，与笔触遮罩 `mask-composite: intersect`。
- **笔触描出** `stroke` 的 `reveal` 选项：每条边一个 `<mask>`，内含沿中心线的宽描边 path，SMIL 把 `stroke-dashoffset` 从全长扫到 0，四边按长度分时长、依次起笔。探针验证 Chromium 在 SVG-as-image（img / CSS mask）语境下会跑 SMIL。`useBrushBorder` 只在首次落笔用带 reveal 的版本（图片一加载即播放，重生成时换静态版本）。
- **山水洇入**：`MRicePaper` 各层 `opacity 0→1`、`blur(8px)→0`，按层序错时，远山先来。纯 CSS。
- **转场**：`startInkViewTransition(update)` 用 View Transitions API，`::view-transition-new(root)` 挂同一张擦入遮罩做 keyframes；不支持或 reduced-motion 直接执行 update。`MInkTransition` 组件封装 `<Transition :css="false">`，进入擦入、离开反向擦掉。
- 测试坑：vitest-browser-vue 底层是 Vue Test Utils，默认把 `<Transition>` 桩掉，测过渡要传 `global.stubs.transition = false`。Playwright 上下文的 `prefers-reduced-motion` 是 no-preference，但所有动效 API 都留了 `reducedMotion` 显式开关。

### 宣纸 worker 基准（2026-09-08，Chromium headless，`pnpm bench:paper`）

| 场景                             | 耗时   | PNG 解码成 ImageBitmap | PNG 大小 |
| -------------------------------- | ------ | ---------------------- | -------- |
| 主线程同步 512²                  | 46 ms  | —                      | —        |
| 主线程同步 1024²                 | 121 ms | —                      | —        |
| Worker 首次 256²（含 WASM 编译） | 53 ms  | —                      | 85 KB    |
| Worker 512²                      | 36 ms  | 3 ms                   | 341 KB   |
| Worker 1024²                     | 137 ms | 12 ms                  | 1.37 MB  |
| Worker 2048²                     | 554 ms | 48 ms                  | 5.5 MB   |
| Worker 1920×1080 带毛边          | 289 ms | 25 ms                  | 2.8 MB   |
| 4 个 Worker 分块渲染 1024²       | 55 ms  | —                      | 1.37 MB  |

结论：

- 宣纸完全可以运行期实时生成，不需要预生成贴图。512² 在 Worker 里 36ms，WASM 编译开销只有几十毫秒。
- 分块并行是有效的：4 个 Worker 把 1024² 从 137ms 压到 55ms，viewport 级别（1920×1080）分 4 块估计 100ms 内。
- 因此 `paper` 模块的策略定为：**按 viewport 尺寸整张生成、4 Worker 分块、不做平铺**，这样不用处理 512² 纹理重复时的接缝问题；devicePixelRatio 上限 1.5；resize 防抖 300ms 后重生成；结果保持为 ImageBitmap 画到底层 canvas，不走 PNG blob URL。
- `goldFlecks` 默认关闭，开启对耗时没有影响，可以作为"洒金"主题选项。
- PNG blob 只在 Worker 到主线程传输时存在，不进网络，341KB 无所谓；但 2048² 的 5.5MB 说明超大尺寸应改用 `transferToImageBitmap` 传 bitmap 而不是 PNG，这需要在 shuimo-core 的 worker 协议里加一个返回 ImageBitmap 的选项（shuimo-core 侧的改动，记一条）。

- `generateLandscape` 在 M 系列 Mac 与中端 Android 上各跑 20 次的 P50 / P95 耗时、输出 SVG 字节数与 path 数。
- 4 层 SVG 各 ~2000 path 时视差 60fps 能否稳住；不行就 `drawImage` 到 canvas 分层。
- `xuan-paper` worker 512×512 耗时。

---

### M2 组件阶段踩到的坑（2026-09-08）

- 浮层（MPopper）被 Teleport 到 body：组件根元素上声明的 `--m-<name>-*` 变量和 `.m-x .m-x__panel` 后代选择器都失效。DatePicker 的 7 列网格因此塌成一列、Select 选项丢内边距。规则：浮层容器上再声明一份变量，选择器写平。
- 笔触边框 `useBrushBorder` 之前用 `useElementSize` 默认的内容盒尺寸生成 SVG，再拉伸到 border-box，窄按钮变形明显；改为 `{ box: "border-box" }`。
- 视觉上隐藏的原生 checkbox/radio 要铺满 label、`opacity:0`、`z-index:1`；用 `display:none` 或 1px 会让 Playwright 点不到、键盘也失效。
- vitest-browser-vue 的 `getByRole` 是严格模式，一个测试里渲染两个同 role 元素会报错；带 `boolean` 的 `defineModel` 类型要显式 `{ default: undefined }`，否则 Vue 把未传当 `false`。
- 子代理并行写组件时，共用文件（`components/index.ts`、`nuxt/components.ts`、`icons/index.ts`）统一由主会话登记，避免冲突。
- `m.base` 层不能给所有 `m-*` 元素强设字色 / 字号 / 光标：BEM 内部元素（类名带 `__`）会因此拿不到根元素的颜色和字号（主色按钮红底黑字、标签小字号失效、按钮文字上出现文本光标）。基础层只对 `:not([class*="__"])` 的根元素设这些，内部元素继承。
- 浮层定位不要用 floating-ui 默认的 `transform: translate()`：入场动画也用 transform 做缩放，两者同属性会让"从 (0,0) 到目标位置"的定位变化被当成动画，浮层从左上角飞过来。MPopper 用 `transform: false`（top/left）并在 `isPositioned` 前 `opacity: 0`（不能用 `visibility: hidden`，那会让面板格子接不住焦点）。
- `useBrushBorder` 的描出动画曾经从来没真正播过：`useElementSize` 挂载后会瞬间报一次 0×0，旧代码把它当成"元素没了"清掉边框，尺寸恢复后又按"已画过"补成静态版。现在 0 尺寸只当抖动忽略；同一尺寸桶不重画；描出播放期内尺寸变了先不换图（mask 按 100% 拉伸能容忍几像素），播完再补静态版；同一尺寸桶 + 参数的边框整个会话只描出一次，列表页来回切换不会满屏重画。挂载时先打 `data-ink-stroke` 标记并给空遮罩兜底，普通边框从第一帧就透明，不再有"墨色边框渐隐"的闪动。
- 边框 / 外形这类按 8px 分桶生成的 SVG 遮罩必须 `preserveAspectRatio="none"`，否则浏览器等比缩放并居中，竖笔会被挤进元素内侧十几像素。
- 笔触边框的落笔描出动画（`useBrushBorder` 的 `revealOnMount`）2026-09-08 起默认关闭：用户反馈切页后各处边框陆续描出很吵；需要时按组件显式开。playground 也不再给页面切换套 MInkTransition。
- 素材库 2026-09-09 接进组件：`createInkEngine` 现在会调 `ensureInkAssets`（`assets: false` 关掉，含水墨光标）。开关 = 短笔触轨道 + CSS 菱形滑钮（开为朱砂）；滑块 = 笔触轨道 + CSS 墨点把手（把手挪到轨道外，避免被遮罩裁掉）；进度条 = `useBrushBorder` 细框 + 实墨条；复选 = CSS 实墨块 / 一横；标签 = 实色块 + 纸色字 + 双线框；列表选中 = 朱砂点套墨圈；树箭头 = 素材库 chevronRight 遮罩。取舍原则见 COMPONENT-CONVENTIONS「形状先用 CSS 画」。
- 2026-09-09 第一波补齐旧库缺失的 23 个组件（并行 sub agent，每组一个）：消息 MMessage/MConfirm/MDialog/MDrawer/MPopover/MTooltip；其他 MDivider/MLoading(+v-loading)/MDeleteIcon/MConfigProvider(+useConfig)/MDarkMode(+useDarkMode)/MSvg/MScroll/MPrinter(+createPrinter)；模版 MBreadcrumb/MPagination/MMenu/MForm/MFormItem/MTable/MTableColumn/MGrid/MCell/MVirtualList。新增素材生成器：inkTipUrl（气泡墨尖）、inkBadgeUrl（墨团记号）、inkLatticeUrl（回纹角饰）、brushPolygonUrl（任意多边形笔触框）、inkMarkUrl 新增 chevronLeft/slash；新增内部工具 internal/modal.ts（滚动锁 / ESC 栈 / 焦点圈定）、internal/popover-trigger.ts、internal/config.ts、divider/use-brush-line.ts（按实际长度生成笔触线）。各组件对旧 API 的破坏性改动见各自 types.ts 注释与 docs/MIGRATION.md（待整理）。
- 踩坑（第一波）：① 在 ResizeObserver 回调链里同步改布局、observe 新节点或移除被观察节点，会抛 `ResizeObserver loop completed with undelivered notifications`，vitest 记为 unhandled error —— 把布局改动推到下一帧，卸载时立刻 unobserve；② 浏览器测试不加载 style.css / tokens.css，`var(--m-border)` 之类整条声明失效（边框量出来 0px），要测样式或截图必须手动 import `src/style.css`；③ `useBrushBorder` 目标元素被 v-if 卸载再挂回是新元素，尺寸桶相同也必须重画（已在 stroke 里按 target 变化重置）；④ `defineModel<boolean>()` 不传时会被 Boolean 转型成 false，分不清「没绑 v-model」，要 `defineModel<boolean | undefined>({ default: undefined })`；⑤ MDarkMode 默认不跟随系统（autoMode=false），否则一挂载整站变暗，违背默认亮色规则。
- 2026-09-09 第二波：16 个基础组件逐个对照旧库源码与 shuimo.design 截图做样式还原（按钮五色实块 + 鱼鳞纹 `inkScaleUrl`；输入类共用 `internal/field-stroke.ts` 的细笔触；复选框笔触方框 + 毛边墨块、单选 `inkCircleUrl` 墨圈；下拉/日历面板笔触边框、选中日期禅圈 `inkEnsoUrl`；开关一抹墨轨道（`brushLineUrl` 新 `taper/endPad`）+ 手绘方框菱形滑钮，开在左；滑块釉面墨珠；进度条框内实墨 + 压字；标签复用旧库三段 SVG 底图 `inkTagFrame`；头像 `inkRingUrl` 禅圆框；折叠标题笔触线 + 旧箭头路径 `IconBrushChevronDown`；列表墨点 / 朱砂墨圈；树 `inkTipUrl` 墨尖箭头；MBorder 补 `border/top/right/bottom/left/mask`，`useBrushBorder` 新 `sides`；MRicePaper 底部左右各两层远山 `inkRidgeUrl(side/crest/mist/depthRange)` + `createParallax` 视差，默认开）。破坏性改动全部汇总在 docs/MIGRATION.md。当前 49 个测试文件 / 270 条通过。
- 擦入遮罩（`reveal/mask.ts`）同理：它被 `mask-size: 200% 100%` 拉成元素的两倍宽，宽高比和 2:1 的原图完全不同，没有 `none` 时浏览器按 meet 等比缩放居中，页面切换时只有中间一条竖带在擦入、两侧内容动画结束才整块弹出（2026-09-08 playground 切换"碎块"问题的根因）。
- 印章 MStamp（2026-09-09）：不打包字体、不解析字体文件，印文用内联 SVG `<text>` 由浏览器渲染，字的墨迹框用 canvas `measureText` 的 actualBoundingBox 量（字体加载完再重排一次，SSR 用兜底比例）；边框顶点 + 二维梯度噪声磨损、印泥白斑 / 边框位移 / 刀刻三组滤镜全部按字号缩放；阴文用亮度 mask 把字和界格抠成透明，纸纹从底下透出来；同页多枚靠 `useId` 区分滤镜 id。坑：① `<text>` 里不能写成多行插值，Vue 会留下首尾空格、text-anchor 居中就偏了，用 `v-text`；② 用户印文绝不进 `v-html`，滤镜字符串才走 `v-html`；③ 方 / 圆 / 多边形按 `size` 定死、字往里缩，不要照 shuimo-core 那样把框撑大；④ 篆体字体（峄山碑篆体）只放在 playground 的 `public/fonts`，组件默认字体栈 `--m-font-seal` 先找篆体、找不到退衬线；⑤ **量字必须拿 `<svg>` 上生效的字体**，根 `<span>` 继承的是页面正文字体，拿它量出来的框对不上篆体，字会偏下、章被撑宽（第一版就是这么"没居中"的）。
- 宣纸移植 shuimo-core（2026-09-09，用户原话「把 shuimo-core 的宣纸移到我们的库里来，特别是洒金宣的效果，结合现有的做一版对比，取两边优势」）：两边对比后的取舍——底纹保留我们的 feTurbulence 滤镜（可平铺、几 KB、浏览器缓存、不用 canvas / worker / WASM）；shuimo-core 的三层矢量特征移植过来叠在上面：① 洒金 `ink/paper/gold.ts`（金箔碎片不规则多边形带弧边 + 金粉小片 + 大片周围的卫星金粉 + 椭圆簇 + 明暗差，贴边的粒在对边补一份所以能无缝平铺，单元 768px 免得金簇重复，单独一层 background-image 叠在纸纹上）；② 纤维 `ink/paper/fiber.ts`（方向场里生长的细折线，锚点往纤维团里靠；GaborNoise 用二维梯度噪声近似）；③ 颗粒（噪声过零线附近的小椭圆，Worley 边缘判定用同一噪声近似）。生宣 / 半熟 / 熟宣按底色离哪个预设最近决定手感参数。没搬的：逐像素 tone 循环（WASM 那套，滤镜已经覆盖）、age 旧化、canvas 渲染、毛边渐变（我们的毛边遮罩够用）。旧的滤镜金点保留为 `paperTextureUrl({ goldSpecks })` 只给对比用，不再是默认。
- 毛边重做（2026-09-09 用户反馈「狗啃的效果」）：旧做法是 400px 的位移滤镜遮罩按 `preserveAspectRatio=none` 拉到元素尺寸，起伏被拉成一个个圆缺口。新做法 `ink/paper/deckle.ts`：每条边一段中点位移分形曲线当撕口轮廓，外面一圈半透明模糊的薄纸，沿轮廓每两三像素伸出一根细纤维（长短、角度、粗细、深浅随机，8% 特别长）；遮罩按元素实际尺寸生成（组件 32px 分桶，`useElementSize`）。坑：**ResizeObserver 回调跟渲染帧走，隐藏标签（后台 / 另一个桌面）里一次都不派发**，尺寸一直是 0——组件挂载时先 `getBoundingClientRect` 兜底；用 Playwright 量页面前先看 `document.visibilityState`，hidden 就别指望 rAF / RO。
- 宣纸体积 / 速度实测（2026-09-09）：data URL 必须用 `svgToDataUrl` 的最小转义，`encodeURIComponent` 会把空格逗号全转成 %XX，洒金层从 231KB 涨到 2.3 倍；改后 768² 洒金层（密度 0.5、片径 2 ~ 12）约 100KB、生成 14ms，纸纹 384² 约 17KB、2ms。shuimo-core 单张纸的默认（密度 0.5、2 ~ 12px）铺满整站像撒了彩纸，默认改成密度 0.15、片径 1 ~ 7px（金粉为主、偶尔几片金箔）；要浓的自己传 `goldFlecks="{ density, sizeRange }"`。
- 印章边框（2026-09-09 用户反馈「边框的效果没有出来」）：shuimo-core 的磨损幅度按 480px 参考尺寸缩放，120px 的章上只剩 0.1px；改成幅度按边框厚度算（起伏最大厚度的一半）、再挖几个咬进边框的缺口（外圈往里、内圈往外，深的会咬断），默认边框加粗到 size × 3.5%、roughness 0.5。全是几何点位，运行时零开销。
- 印章性能实测（2026-09-09，playground 23 枚，M 系列 Mac，Chrome）：`generateStamp` 每枚约 1.1ms、24 个字的 canvas 度量 3ms、23 枚从挂载到画完 42ms、静止时 CPU 为 0、滚动时 Chrome 总 CPU 15 ~ 30%；**每帧都改印泥色逼着重绘**时 Chrome 总 CPU 约 170%（不带滤镜 70%），开销和滤镜原语个数成正比、和像素面积基本无关（把作用区域从外扩 36% 改成绝对坐标几乎没变化）。因此把边框位移并进印泥滤镜、崩口和石屑共用一层噪声，每枚从 3 组滤镜 / 6 个 feTurbulence / 24 个原语减到 2 组 / 2 个 / 15 个，重绘 CPU 降到约 150%；再加 `content-visibility: auto`，屏幕外的章不栅格化。结论：别给印章做逐帧动画（颜色过渡、滤镜参数动画），静态展示和滚动都不贵。
- playground 已改为「左侧组件菜单 + 右侧单组件示例」布局（`playground/src/registry.ts` 登记，`demos/*.vue` 一个组件一个示例，hash 路由，MInkTransition 切换）。新组件要在 registry 里加一条。

## 5. 组件清单（41 → 42）

命名统一 `M` 前缀，全部 SFC，全部 `defineModel`，全部 `inheritAttrs` 规范化，API 允许 breaking。

**base**
Avatar · Button · Checkbox / CheckboxGroup · Collapse / CollapseItem · DatePicker · Input · InputNumber · List / ListItem（原 Li）· Progress · Radio / RadioGroup · Select · Slider · Switch · Tag · Tree

**message**
Confirm（函数式）· Dialog · Drawer · Message（函数式，pointer events 拖拽）· Popover · Tooltip

**other**
ConfigProvider（原 config；提供主题、语言、ink tier）· DarkMode（太极鱼，保留 SVG path 形变，这是旧版里最好的一段）· Icon（合并 DeleteIcon + Svg 三件套；图标改为按需 `import` 单个 SVG 组件，不再 202KB 内联 symbol 集）· Divider · Loading + `v-loading` · Scrollbar（原 Scroll，做真滚动条而不是只加 class）

**template**
Border · Breadcrumb / BreadcrumbItem · Cell · Grid / GridItem · Form / FormItem · Menu / MenuItem（重做，旧版自注"给文档临时写的"）· Pagination · RicePaper · Table / TableColumn · VirtualList

**新增**
Stamp（印章）—— 2026-09-09 已做：`src/ink/stamp/`（排版 / 外形 / 磨损 / 滤镜，从 shuimo-core 的 stamp v2 移植思路但不带字体解析）+ `components/stamp/MStamp`。

**删除并说明**
Printer：它是 console.log 的样式封装，不是 UI 组件，不进组件库；文档站需要的话放 docs 本地。

Web Component 版（MWCBorder / MWCRicePaper）不做：旧版在 import 时就 `customElements.define`，SSR 直接炸。需要时用 `defineCustomElement` 单独出一个入口，不进 1.0。

---

## 6. 主题与 token

- `colors.css`：45 个传统色变量名原样继承（`--m-color-songlan` 菘蓝、`--m-color-luozidai` 螺子黛…），五行阴阳别名保留。这是品牌资产。
- `tokens.css`：语义层 `--m-fg / --m-bg / --m-paper / --m-ink / --m-accent / --m-danger / --m-radius / --m-space-* / --m-font-*`，组件只用语义 token，不直接用传统色。
- 主题：默认明亮纸色（用户 2026-09-08 明确要求）；暗色要显式 `:root[data-theme="dark"]` + `color-scheme: dark`；写 `data-theme="system"` 才跟随 `prefers-color-scheme`。不再用 `html[dark]` 属性，不再对贴图 `invert(1)`（因为没有贴图了）。
- `@layer m.reset, m.tokens, m.base, m.component, m.ink`：用户覆盖样式不用堆选择器。

---

## 7. 质量与流程

- 类型：`vue-tsc --declaration --emitDeclarationOnly` → tsdown `dts` 合并成单文件；`vp pack` 后跑 `attw`（arethetypeswrong）校验。
- API 元数据：`scripts/gen-meta.ts` 用 vue-component-meta 扫每个 SFC → `web-types.json`（IDE 提示）+ `docs/api/*.json`（文档 API 表）。JSDoc 写在 `types.ts` 上一次，两边共用。
- 单测：vitest 4 browser mode（Chromium），每组件一个 test；ink 引擎测 seed 复现性（同 seed 输出字节一致）。
- 视觉回归：Playwright 对 playground 每组件 × light/dark × reduced-motion 截图，`maxDiffPixelRatio: 0.002`；ink 引擎固定 seed 保证可比。
- Lint/格式：`vp check`（oxlint + oxfmt），配置沿用 shuimo-core 根 `vite.config.ts` 的写法。
- 提交：Conventional Commits，changesets 生成 CHANGELOG，`release.yml` 发 npm + GitHub Release。
- 文档站：Nuxt 4 + Content，`<DemoBlock>` 用 MDC 语法嵌 `demos/*.vue` 并显示源码（shiki 内置于 Content），字体由 font-subset 插件在构建期出 woff2。

**2026-09-10 现状**：

- 已做：`vp check`、`vue-tsc`、`gen-meta`（web-types + `docs/api/*.json`）、`check-style`、vitest 浏览器模式 364 条、changesets 与 `release.yml`。
- **没做**：Playwright 视觉回归（`packages/ui/e2e/` 还不存在，CI 里也没有这一步）。
- 文档站：Nuxt 那套只有 `app/app.vue` 和 `content/index.md` 两个空壳，正文一个字没写。**眼下的文档就是演练场**（每组件一页 + 页底自动生成的 Props / Events / Slots 表），已部署到 Vercel，见文末「仓库与部署」。Nuxt 站要不要继续做还没定。

---

## 8. 里程碑

| 阶段                       | 内容                                                                                                             | 出口标准                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 骨架（1 周）            | 仓库、vp 工具链、CI、changesets、tokens、colors、layers、playground、docs 空站；**shuimo-core benchmark 出数字** | `pnpm i && vp check && vp test && vp pack` 全绿；benchmark 报告 —— **2026-09-08 完成**，见 §4                                                                                                                                                                                                                                                                                                 |
| M1 特效引擎（2 周）        | `ink/` 模块 + RicePaper + Border + DarkMode（Stamp 随 shuimo-core 移除一起搁置）                                 | playground 首页：程序化宣纸 + 墨晕 + 笔触 + 落墨 + 转场，tier 0/1/2 可切 —— **2026-09-08：shuimo-core 已移除**，paper（SVG 纹理）/ stroke（自写笔触）/ bleed / reveal / transition / parallax 与 MRicePaper / MBorder / MInkTransition 均为纯 SVG 实现并有浏览器测试；山水与视差层删除；MDarkMode 未做                                                                                        |
| M2 基础组件（3 周）        | base 16 个 + Icon + Divider + Loading + ConfigProvider                                                           | 每个有 test + 截图基线 + 文档页 —— **进行中（2026-09-08）**：base 16 个全部完成并有浏览器测试（Avatar、Button、Checkbox/Group、Collapse/Item、DatePicker、Input、InputNumber、List/ListItem、Progress、Radio/Group、Select、Slider、Switch、Tag、Tree），写法约定见 `docs/COMPONENT-CONVENTIONS.md`；Icon / Divider / Loading / ConfigProvider 未做；shuimo-core 相关特效按用户决定暂不再接入 |
| M3 消息与模板（3 周）      | message 6 个 + template 11 个 + Scrollbar + VirtualList                                                          | 同上；Dialog/Drawer 接 View Transitions                                                                                                                                                                                                                                                                                                                                                       |
| M4 Nuxt 模块与发布（1 周） | `./nuxt`、`./resolver`、web-types、attw、1.0.0-alpha 发 npm                                                      | 一个干净的 Nuxt 4 项目和一个 Vite 项目各跑通                                                                                                                                                                                                                                                                                                                                                  |
| M5 文档站上线（1 周）      | zh/en 全部组件页、色板页、ink 引擎调参页                                                                         | Lighthouse 性能 ≥ 90                                                                                                                                                                                                                                                                                                                                                                          |

总计约 11 周单人节奏。

**里程碑现状（2026-09-10）**

| 阶段 | 状态                                                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0   | 完成                                                                                                                                                       |
| M1   | 完成（shuimo-core 已移除，改成本仓库自己的 `ink/`；山水与视差删过一轮又在弹窗题头小景里重做）                                                              |
| M2   | 完成（base 16 个 + 17 个 Icon + MDivider / MLoading / MConfigProvider / MDarkMode 都在）                                                                   |
| M3   | 完成（消息、模板、MScroll、MVirtualList 全部就位；Dialog / Drawer 走的是自写的 `useModal` + 笔触框，没接 View Transitions）                                |
| M4   | **部分**：`./nuxt`、`./resolver`、web-types、attw 都有并进了 CI；**npm 还没发**（`0.0.0`，registry 上查不到），也还没有一个干净的 Nuxt / Vite 项目跑通验收 |
| M5   | **未开始**：Nuxt 文档站是空壳；眼下由演练场代替，已上线 Vercel。Lighthouse 没测过                                                                          |

组件数从计划的 41 涨到 59（多出来的是旧库没有、常规库必备的结构件，见下面各轮记录）。

## 第一批新组件（2026-09-09）

旧库没有、常规库必备的 7 个结构件，五路子代理并行写，主会话合并：**MTabs/MTabPane、MSteps/MStep、MCard、MBadge、MAlert、MEmpty、MSkeleton/MSkeletonItem**。共 59 个组件、55 份 CSS，整包 352 条浏览器测试通过。

取舍与要点：

- 几何一律 CSS：card 型标签页的双线框、卡片双线框、角标胶囊 / 小点（m.ink 层用多值 `border-radius` + `rotate(-3deg)` 做印泥的不规整感，不生成 SVG）、骨架屏全部占位块。
- 墨感才用 SVG：标签页底线和指示器、步骤条连接线、卡片标题分隔线、警告条左侧色边都是 `useBrushLine` 按实际长度生成；步骤条完成节点用 `inkBlobUrl` 毛边墨团（raggedness 0.08，0.14 像齿轮）、当前节点用 `inkEnsoUrl` 一笔圆；警告条图标用 `inkBadgeUrl`；空状态用 `inkEnsoUrl` / `inkRidgeUrl`（远山必须 `crest: true`，否则只是一片灰雾）。
- 骨架屏动画只动 `transform`，无滤镜；`prefers-reduced-motion` 下关闭。
- 踩坑：笔触线画幅直接改元素高度会让 `useElementSize` 同帧收到两次变化，Chromium 报 `ResizeObserver loop completed with undelivered notifications`（vitest 当 unhandled error）——改成把画幅画在 `::before` 上，元素自身盒子不动。divider / collapse 仍是改高度的写法，出同样告警时照此改。
- 角标 `danger` 用 `--m-seal`（`--m-danger` 与 `--m-accent` 同色），`primary` 用 `--m-info`，`info` 用 `--m-fg-muted`。
- 未做：标签页导航溢出滚动；包入口没导出 `src/icons`（Demo 里插槽图标只能用文字）。

## 弹窗返工（2026-09-09）

用户原话「我们的弹窗效果……像极了山寨产品」。问题：面板随内容成一条扁片、四角回纹粗得像直角钩、远山是遮罩糊出的一团灰、朱砂日孤零零浮在上面、关闭牌像便利贴。对照旧版底图 bg.webp 重做：

- 新素材 `ink/assets/scene.ts`（`inkSceneSvg`）：题头小景返回**内联 SVG 标记**而非 data URL——墨用 `currentColor`、纸用 `var(--m-bg)`、日用 `var(--m-seal)`，能跟主题换色；近山用纸色实心垫底，把后面的太阳和纸框顶边压住，山脚才像踩在框线上。`paintBrush` 输出的 `fill="#000"` 内联时替换成 currentColor。滤镜 / 渐变 id 要全页唯一：`useId` 只在同一个 Vue 应用内唯一，多应用（测试里两次 render）会重复，所以把 seed 也编进 id。
- 纸框笔触从 4px/粗糙 0.6/飞白 0.18 收到 3px/0.4/0.08：毛边飞白多了就是涂鸦。回纹角饰 `inkLatticeUrl` 加 `bleed` 选项，线细到 1.6 时晕染要降到 0.8。面板 `min-height: 240px`、留白 40/44px；标题走 `--m-font-brush`（playground 没装 wljh，回退无衬线）。
- 关闭按钮改成 CSS 画的木牌：墨色牌身、顶上一个孔、一根细绳，晃动幅度从 12° 降到 4°；不再给它套笔触边框。
- 第二轮（同日，用户贴图对比旧版）：山改成两座圆润的软边山——纸色实心 + **裁在山体内侧**的宽墨晕（`clipPath`，山外仍是干净的纸）+ 细脊线，不再用折线勾勒；山下补三道水纹（画在 viewBox 外、靠 `overflow: visible` 落进框里）；回纹改成两个错位相扣的「回」字（12 格网格，各一外框一内框）；纸框 4px、`overshoot: 0`（角上有回纹压着，出头反而乱）；石牌改成从框线挂进面板里、拱顶灰石色；面板最小高 360px（旧底图接近 3:2）。
- 第三轮（用户贴旧版局部放大图「注意细节」）：山体灰用 `linearGradient`（objectBoundingBox）从山脊往下大面积渐淡，再叠裁在山体内的宽墨晕；脊线改成沿贝塞尔取点后 `paintBrush` 画的有粗细一笔（山脚两端掐掉几点，别拖到框线上）；日头 `radialGradient` 淡朱 + 轻模糊；枯树 9 笔（弯主干、三主枝各带细杈）；水纹三道用正弦取点后 `paintBrush`，波幅往末尾收。后山右肩加一个小起伏让日头藏在肩后。
- 第四轮（用户「仔细分析细节，特别是四个边角，还有装饰的点」，把旧底图四角和框线放大到 5 倍看）：旧版角饰是**双线勾边的「卍」字纹**——横竖两根杠沿框线、四个臂各拐一钩、钩头挂小方，框线走到角饰处停笔、由钩接上；框线两侧还有干笔溅出的小墨点；关闭牌是尖顶石牌、绳头一个结、牌顶一圈墨渍、牌底一枚坠子。对应改动：`inkLatticeUrl` 重画成 24 格万字纹（框的拐角落在 (6,6)）；`generateBrushBorder` 加 `cornerGap`（拐角留空，线在角饰处停）和 `specks`（沿线洒点）；新素材 `inkSplashUrl`（墨点飞溅遮罩）；石牌用 `clip-path` 五边形画在 `::before`，绳 + 结在 `::after`，墨渍和坠子是两个 span，只在 m.ink 层显示。
- 顺带修了一个全局 bug：`theme/base.css` 里 `:where([class^="m-"]…):not([class*="__"])` 给所有 m- 开头的 class 设了 `color: var(--m-fg)`，`.m-icon` 也被匹配，图标不跟随所在元素的文字色（深底上的叉是黑的）。改成 `.m-icon { color: inherit }`。
- 关闭牌不能像旧版那样大半探出右框线：弹窗贴视口边时（`100vw - 32px`）会被裁掉、点不到，测试里就撞上了（`elementFromPoint` 返回 null）。现在只探出 6px。
- 第五轮：挂牌改挂在**右边竖框线**上（不是上框线）——绳结钉在右框线上、牌骑在线上、位置在右上角回纹下方 58px，和旧版 close.webp 的落点一致；摇摆照旧版 10°→15°→0→-10°→-15°→0、8 秒匀速。测试里点挂牌要 `click({ force: true })`：Playwright 等不到一直在摆的元素"稳定"，会超时。
- 第六轮（用户贴旧版整图「再比对一回，仔细看下差异」，把两版按区域放大到 5–8 倍对照，再回到旧底图 bg.webp 原尺寸量角饰）：量出来的差异和对应改动——
  - 角饰：老底图**四个角是手画的四套不同图案**（用户指出「左上右上左下右下都是不一样的效果」），一套图案旋转四次怎么调都不像。把老图四角原尺寸放大 8 倍逐个描成勾边长方形：左上最小（方块 + 竖杠 + 横带 + 下挂方块，约 31×26px），右上多一个探出框外的小方（39×34），右下、左下是更密的井字回纹（43×43、45×43）。`inkLatticeUrl` 的 `corner` 现在选图案而不是旋转，28 格画幅、框线在离外沿 6 格处、坐标 = 老图像素 × 0.281；56px 画幅、`inset: -12px`、框线 `cornerGap: 18`、线 1.3px 不晕染。中间还走过两次弯路：先按长边给 40px 被指出太大，又改成一套卍字空心条旋转四次，都不对。
  - 框线：旧版 4–5px、边缘是软的干笔毛边、粗细缓慢起伏；原来 4px 的墨带看着一块一块的。改 4.5px、粗糙 0.45、`bleed: { scale: 2.5, blur: 0.6 }` 把边缘糊软，溅点减半。
  - 山景：旧版山景宽占弹窗四成、峰顶只比框线高山景宽的 14%，是两座又矮又长的山。画幅从 480×140 改成 480×80、宽 58% → 44%；前山圆顶靠左、后山高而肩长、日头 r=20 半掩在右肩后；前山右坡单独一笔浓墨压在后山身上往下飞白；灰只在山的中下段（渐变脊线下留白）加几道糊开的皴，不再沿脊线抹宽墨晕；脊线 2.6 → 2；枯树和山齐高、枝短密；飞鸟移到鞍部上方、笔重；水纹三道差不多长、往右下错成平行四边形、笔 2.8。
  - 挂牌：旧牌约 20×34、尖顶占三成、**冷灰蓝**（`color-mix(ink 72%, info)`，左上亮右下暗）、牌顶离框线 40px 紧挨角饰下面、绳 2px 绳结横椭圆、牌顶是**浅色放射状喷溅**（不是深墨点）、牌下一小段绳再接一枚向右弯的小坠。对应：22×36、`top: 42px`、墨渍 opacity 0.32 用石板色、`inkSplashUrl` 外圈点拉长成放射细痕、坠子 span 自身画绳、`::after` 画坠。
- 第七轮（用户逐角截图、放大到 5 倍以上要求「看形状和如何和边结合」，前几轮全靠眼睛估、连错三次）：改成**用程序逐列扫描老图**量坐标（PIL：每列第一个非透明 / 非遮罩 / 深色像素），以老版**真实截图**为准（老页面用 border-image 把顶边拉高两成多，底图上的比例在页面上不成立）。量出来的关键事实：
  - 左上回纹整个在上边线**下面**：上边线中心 y=65 时 A 顶 72.5、C 顶 82.5、C 底 89.5、D 底 98；A 左沿压在左边线中心上；B 只是一根 2px 实线；左边线从 C 底起笔，起笔细往下变粗；上边线在左上整段藏在山下面。
  - A、C 左半的**内部是透明的**（露出遮罩），纸从 B 右沿才开始：面板加 `clip-path` 把这块挖掉，回纹（`::after`）和题头小景挪到新加的 `.m-dialog__frame` 包裹层上（面板的伪元素和子元素都会被 clip-path 一起裁掉），开合动画的 transform 也挪到包裹层。
  - `generateBrushBorder` 的 `cornerGap` 支持按角按边给值（`{ tl: [横边, 竖边], … }`），四角图案不同、每条边两头的留空也不同。
  - 山景改成从真实截图量的坐标：画幅铺弹窗宽 50%，前山脚踩在回纹竖杠右上角（比面板上沿低 14 单位）、山体纸色底往上沿下面多铺一截盖住框线；后山峰顶无勾线只有淡灰；日头在最上层盖住脊线；水纹是三道交错的长弧；树根在上边线高度、树 33px 高；脊线软化（微模糊 + 0.88 不透明）、山脚起笔细。
  - 踩坑：弹窗一直开着时页面不会重载，改了内联 SVG 截出来还是旧图——每次改完先 `location.reload()` 再开弹窗再截。
  - 右上回纹（用户放大 6.5 倍的截图量的，原点在框角）：竖杠 B 是一根实线，从上边线扎下来直到下挂方块 D 底（左 17.9px、深 29.5px）；D 的右沿和中间方块 E 的左沿是同一根竖线贯穿横带 C；E 顶边和探出框外的小方 F 的底边是同一根横线；F 左沿往下就是 E 右沿、止于 C 顶；C 右端开口，右边线从 C 底（17.5px）起笔。B 右边、C 底（18.2px）以上整块没有纸，clip-path 再挖一块。线的连法比条子的位置更要紧——位置差 1px 看不出，多一根、少一根、断一根一眼就穿帮。
  - 左下回纹（放大 8.75 倍的截图量的）：七横七竖的井字，宽 45px、高 49px，56px 画幅装不下——`inkLatticeUrl` 画幅改 64px（32 格），坐标仍按 28 格写、靠右靠下的角在代码里整体挪 4 格；实线杠改成显式 `bar()` 标记，不再靠「两个点」判断。V1 分上下两段（H2 到 H3 之间断开），V2 是实线贯到下边线，H3、H4 右端开口，左边线在 H4 停笔、下边线从 V2 起笔；左边线和 H5、H7、V1 围出的小方，以及 V1、V2 之间 H4 以下那块没有纸，clip-path 再挖一块。
  - 右下回纹（放大 10 倍的截图量的）：就是左下那套的镜像，线的位置和连法一一对应（粗实线竖杠在右 18.7px 贯到下边线、长横线在底上 18px 到右边线；右边线在长横线停笔、下边线在粗竖杠停笔；粗竖杠右边、长横线以下没纸）。四个角至此都按真实截图核过。
  - 题头小景（用户放大 5.1 倍的截图量的，原点在左上框角）：后山右肩很窄、从 x≈313 起就陡降到 (345, 47)，日头（半径 15、圆心 (335.5, 24)）骑在这段陡坡上且画在山**后面**——山体盖住它左下角、脊线从它身上穿过；后山左坡没有勾线只有灰晕；前山下半段只有一根淡细线、主勾线从半山腰起、峰顶只有 3 单位宽、鞍部那一笔最宽（8.5）；右坡缓坡下两笔皴；水纹是五笔（第一笔尾端一小钩、第二笔反弯、右边一短一长）；飞鸟是「乂」形；树干在 x≈48。山体的灰不再是整片渐变（看着像灰纸板），改成沿脊线画宽笔、糊开、裁在山体内的一圈软边。后山纸色底只铺到 x=390、末端一条斜边压在框线上，上框线从山脚下面由细到粗地露出来（老图框线从框角右边约 243px 冒出来）。
  - 遮罩的两个问题（用户「你自己去看一眼」）：① 默认根本没有遮罩——`mask` 的类型是 `boolean | ModalMask`，编译成 `type: [Boolean, Object]`，Vue 对带 Boolean 的 prop 会把"没传"当成 false，`resolveMask(false)` 就是不显示；解构时写默认值 `mask = true` 才对。② 有遮罩时磨砂最后一下才突然出现——淡入淡出写在根上，根一半透明就成了独立的合成组，里面 `backdrop-filter` 看不到页面，要等根完全不透明那一刻才糊上。改成根不动（只留一条 transition 给 `<Transition>` 计时），遮罩自己渐变 background-color 和 backdrop-filter（blur 0 → 8px），面板包裹层自己淡入。抽屉同样两处一起改了。
  - 步骤条的连接线（用户「序列列表的线是不是也得重新实现」）：原来 1.5px、带手抖、边缘噪声大，看着像手写的歪线，竖向更像一截截抖动的短杠。老库的线（line/crossrange.webp，548×5）是笔直的一根淡干墨，靠断口和丝缕出枯笔质感。改成 2px、不抖、飞白 0.4、边缘噪声 0.35、八成不透明；`useBrushLine` 加 wobble / roughness / flyingWhite 透传。
  - 虚拟列表的分隔线（用户真正指的是这个）：原来是 1px 的 CSS 内阴影，整页里就它是一条死板的灰线。改成和表格行间线一个口径的细笔触线：按列表宽度分桶生成一张、写进根变量，所有项共用；线画在项之间一个零高的 `.m-virtual-list__divider` 元素的伪元素上、骑在交界线上——不占高度（占了首项和其余项会差 1px、量高度会抖），也不受定高项 overflow: hidden 的裁切（伪元素放在项上会被裁掉半根）。
- 面板底下的硬边灰方块：是面板普通模式带过来的 `box-shadow`（下偏 24px），被四角挖纸的 clip-path 裁成一块两侧竖直、底部截断的方块。老版是平铺在蒙版上的纸、没有投影，水墨层直接 `box-shadow: none`。
- 挂牌关闭按钮按老素材（老仓库 `lib/assets/model/close.webp`，46×75，老 CSS 按弹窗宽 92/996 缩放、绳在第 24 列、居中骑在右框线上）逐项对：整套冷灰蓝一个色系（牌底 rgb(37 42 52)，绳、结、坠子都是灰蓝、不是墨黑）；石板色改成墨 86% 掺 info（原 72% 太蓝）；牌身上浅下深、左沿压暗边、叉左下撒三粒浅点；叉缩到约 9px、心在牌高 53%、浅灰蓝粗笔；牌顶的喷溅重写成霜溅——细碎点子贴着尖顶两条坡边堆、肩头最密、往外稀，底下垫一层糊开的薄雾，画幅 44×24、顶边在牌尖上方 6px；坠子绳 3px、坠 4.5×11；整个按钮加 0.8px 同色投影糊掉硬边。
- 挂牌两处返工：老素材放到像素级看，牌顶的"喷溅"其实是一整块实心的浅灰蓝霜领——从牌尖两侧横着铺开、实的部分每边比牌身宽出约 7px、外沿是锯齿晶花边，不是散点更不是模糊的一团；生成器改成"底稿轮廓 + 沿外法线交替顶出的锯齿"画一个闭合多边形，外面描一圈半透细边当晕，垫在牌身后面（z-index -1）。老版鼠标移上去不变色；我们原来叉跟着普通模式变主题色、牌身整块变印章红，改成叉不变色、牌身只提亮 18%。绳结挪到牌尖上方 9px（老素材位置），摆动轴心跟着挪。
- 霜领第二版：第一版底稿下沿画平、外沿又宽（每边 7px），正常大小下就是牌背后一口方箱子。按老素材逐行量：顶边和牌尖齐平、上面翘两三个尖角，外沿只宽出 4–5px，过了肩头顺着牌身两侧越收越窄、拖到肩下十来 px 收成细边——底稿改成这个轮廓，锯齿也缩小，画幅 44×28、牌尖在 (22, 7)。
- 霜领第三版（定稿）：用户指出正常大小下老图明显是"花瓣"——七八朵分开的浅灰蓝尖瓣墨花散在屋檐两侧和肩头，彼此挨着、压在屋檐线上、有空隙，不是连成片的领子。生成器改成 12 朵 5–7 瓣的肥瓣星形花沿两条屋檐线排过去（肩头那朵最大、牌尖上方两朵小），瓣尖长短随 seed 浮动、瓣根收到一半，再撒几粒小点；画在牌身之上、叉之下，半透。
- 霜领第四版（定稿）：用户指出老图的花是"包着牌的上半截"、不是飘在旁边——花心改成落在两条屋檐线上（往外偏 1px），一半盖在牌身里、一半探到外面，从左肩绕过牌尖到右肩，肩头那朵最大、肩外侧和肩下各补一朵，左右镜像加随机抖动。
- 霜领第五版：花改成菱形——每朵四个尖，长轴 r、短轴五到七成，四条边往里收腰成四角星，整朵随机转角；落点不变（箍在屋檐线上）。
- 演练场每个组件页底下加了「接口」区（`playground/src/ApiDoc.vue`）：属性 / 事件 / 插槽三张 MTable，数据是 `docs/api/<组件名>.json`（`packages/ui/scripts/gen-meta.ts` 构建时用 vue-component-meta 生成），用 `import.meta.glob` 一次打进来按组件名取；defineModel 产出的属性和 update:xxx 事件合并成一行 v-model。生成器补了事件说明：vue-component-meta 的 event 上 description / tags 都是空的（事件被转成函数重载，接口成员的注释丢了），改成解析同目录 `types.ts` 里 defineEmits 用的 `*Emits` 接口，按事件名把成员上方的 JSDoc 对回去。

## 卡片 / 角标 / 标签页 水墨重做（2026-09-10）

用户点名这三个"没有突出水墨特色"，老版 shuimo-ui 没有这三个组件，形是新定的（每个给了三个方向，用户都选了推荐项）：

- 卡片 = 册页：四边毛边宣纸（deckleMaskUrl 按尺寸分桶）叠淡纸纹（新 `ink/assets/sheet.ts`，白底纹理 multiply 压纸色），三种 frame 在水墨层都是 useBrushBorder、只差粗细；标题手写体 + 左侧一笔朱砂短竖；阴影改成两层 drop-shadow 的墨影；新增 `seal` 插槽在右下角盖印。
- 角标 = 朱砂小印：数字印面用 inkShapeUrl 毛边方块（按字数分桶换 seed）、印泥厚薄用新 `ink/assets/paste.ts` 的 turbulence 纹理做第二层 mask（mask-composite: intersect），dot 用 inkBlobUrl 带 bleed 的一滴；新增 `seed` prop；弹跳改成盖章。
- 标签页 = 签条：card 型每个标签是 inkShapeUrl 毛边签条（不用 inkTagFrame，它四面自带描边、也转不成竖排），激活的探进内容区框线 2px、三面笔触框随激活项和 position 换（直接用 brushBorderUrl/applyBrushBorder），内容区 useBrushBorder；line 型全部手写体、指示器改朱砂 3px 飞白一横；加了 document.fonts.ready 后重测。
- 已知：手写体变量 `--m-font-brush: "wljh"` 没有对应 @font-face，机器上没装就退回黑体（弹窗标题同样），待补字体。

## 运行时素材体积（2026-09-10）

发布包本身很小（全量 min+gz 约 100 KB，没有位图和字体），大头在运行时：每个实例的笔触框、毛边纸缘、笔触线都是现算的 SVG data URL 挂在元素 style 上，卡片页 12 张卡有 790 KB 内联 SVG。第一轮不改画面只改写法：坐标统一写成相对增量的 path（`compactPath`，十分之一像素整数做差、不漂移）、数字去掉多余的零、毛边纸缘的轮廓只写一次 `<defs>` 引用两次、洒金和纤维改相对坐标。结果：笔触框 16.8→7.9 KB、纸缘 20.4→12.4 KB、笔触线 4.5→2.8 KB、远山 26→12.5 KB、洒金 49→42.5 KB；卡片页 790→约 510 KB。卡片区域像素对比零差异。还能压的下一步是"同一份素材只写一次"：把 data URL 注册成一条样式规则、元素上只挂类名，同尺寸的实例就不再各带一份。

- 第二轮"同一份素材只写一次"（`ink/registry.ts`）：现算的 data URL 登记成样式表里一条 `[data-ia-xxx="k…"]{--m-xxx:url(…)}` 规则，元素上只挂属性；用 data 属性不用 class 是因为 Vue 更新 class 会整体重写。笔触边框、笔触线、卡片纸缘走 `applyInkVar`，标签 / 表格 / 表单项 / 按钮 / 列表 / 虚拟列表 / 签条 / 角标走 `inkVarBindings`；SSR 或插不进规则时退回内联。效果（演练场各页，原本会内联的量 → 实际登记的量）：标签页 301→38 KB、表格页 197→30、按钮页 216→48、复选框页 119→28、表单页 239→86；卡片页 12 张卡尺寸各不相同所以只从 324 降到 293。页面 HTML 从 982 KB 降到约 380 KB。剩下每页固定的约 190 KB 内联是宣纸底（远山 4 层、洒金、纸纹），每页一份、不重复。

## 仓库与部署（2026-09-10）

代码进了 GitHub 组织：<https://github.com/shuimo-design/shuimo-ui-next>（公开，MIT）。之前的工作按四笔提交进去：workspace 与脚本、水墨引擎、组件全集、演练场与文档。

文档站（也就是演练场）发在 Vercel：<https://shuimo-ui-next.vercel.app>。构建配置在仓库根 `vercel.json`——先 `pnpm build` 出库、再 `pnpm -C playground build`，产物取 `playground/dist`。演练场用 hash 路由，所以不需要 SPA 回退规则。

先试了 GitHub Pages，能跑通，但按用户要求换成了 Vercel，`pages.yml` 已删、仓库的 Pages 功能已关。

**接 Git 集成绕的弯**：Vercel 的 GitHub 应用早就装在 shuimo-design 上（installation `38495129`），但授权仓库只勾了 `shuimo-playground` 一个，`vercel git connect` 因此失败。改这个列表要组织管理员，当时 `JobinJia` 只是成员，所以先做了个过渡方案：`.github/workflows/deploy.yml` 用仓库自己的 `VERCEL_TOKEN` 调 Vercel CLI 部署，不碰组织权限。

后来账号升成了组织管理员。注意用 `gh` 调 `PUT /user/installations/{id}/repositories/{repo_id}` 仍会 403——本地令牌的授权范围里没有 `admin:org`，跟角色无关。最后是在浏览器的组织设置页把 `shuimo-ui-next` 加进授权列表（保持 Only select repositories，没有放开成 All repositories），然后 `vercel git connect` 成功。过渡用的 `deploy.yml` 已删，`VERCEL_TOKEN` 也不需要了。

现在推 main 由 Vercel 自己拉代码构建，开 PR 会自动出预览部署并在 PR 里留链接（`vercel.json` 里没有设 `github.silent`，就是要这条评论）。

踩坑记两条：

- GitHub Actions 的 `if` 条件里**读不到 `secrets` 上下文**，job 层和 step 层都不行。要按「secret 配没配」分支，得先在 `env` 里接一道，再判断 `env.XXX != ''`。
- Vercel 部署产生的那个带哈希的长域名默认受 SSO 保护（访客会被弹到登录页），但正式别名 `shuimo-ui-next.vercel.app` 是公开的。验证可访问性要认准后者。

**CI 两处红叉（2026-09-10 修）**

仓库推上去之后 CI 和 Release 从第一次提交起就一直失败，和文档改动无关：

- `MStamp.test.ts` 有一条断言比的是「serif 排出来的章宽 ≠ monospace 排出来的」。这要求机器上装了两套以上中文字体；GitHub 的 Ubuntu runner 只有 Playwright 带的 wqy-zenhei 一套，两个通用族落到同一个字面、宽度必然相等，于是假失败（本地 Mac 上过）。改成逐字体和 `createGlyphMeasurer(font)` 直接生成的结果对账——同样能判出「有没有拿真渲染的字体去量」，且不挑机器。
- `release.yml` 每次推 main 都跑 `changeset publish`，于是每次都 `ERR_PNPM_FAILED_TO_PUBLISH … 404`。先按 `deploy.yml` 的写法加「没配 `NPM_TOKEN` 就跳过」，**没拦住**——shuimo-design 组织有一个组织级的 `NPM_TOKEN`，本仓库自动继承，「有没有令牌」根本判不出来。当时以为原因是 npm 上 `@shuimo-design` 这个 scope 不存在——**这个判断错了**，只查了 `@shuimo-design/color` 一个不存在的包名就下了结论；scope 其实是有的，下面已经有 lunar、shuimo-ui-nuxt、milkdown、blocksuite-core、calendar-core 五个包。对 scope 包来说没有发布权时 npm 同样返回 404（不告诉你包在不在），所以真正的原因更可能是那个组织级令牌对新包没有写权限。总之先加了显式开关：仓库变量 `RELEASE_ENABLED` 不为 `"true"` 时整个 job 跳过。

## 首个预发布 1.0.0-alpha.0（2026-09-11）

按 §8 M4 的说法发 alpha。做法：`changeset pre enter alpha` 进预发布模式，写一份 major 的 changeset，`changeset version` 把 `0.0.0` 顶成 `1.0.0-alpha.0`，发布时 changesets 会自动带 `--tag alpha`，所以不会占用 `latest`。

发出去的包：222.7 KB（解包 972.9 KB），13 个文件，只有 `dist/` 和 `web-types.json`，没有位图也没有字体。`attw --profile esm-only` 全绿。

踩坑：**`pnpm version` 跑不到 `package.json` 里的脚本**——pnpm 自带同名子命令，会把它截胡，报「A version argument is required」。得写 `pnpm run version`。`release.yml` 里原本就是 `pnpm version` / `pnpm release`，已一并改成 `pnpm run …`。
