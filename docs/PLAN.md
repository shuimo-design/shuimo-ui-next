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
shuimo-ui-next/                      # 仓库名待定
├─ package.json                      # private，workspace 根；scripts 全走 vp
├─ pnpm-workspace.yaml               # catalog 锁 vite / vitest / vite-plus，与 shuimo-core 同写法
├─ vite.config.ts                    # vp 的 fmt / lint 根配置
├─ .changeset/
├─ .github/workflows/
│   ├─ ci.yml                        # PR：install → vp check → typecheck → vp test → build → e2e(截图)
│   └─ release.yml                   # main：changesets publish
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
├─ playground/                       # Vite 8 + Vue，纯本地调试，不发布
├─ docs/                             # Nuxt 4 + Content 文档站
│   ├─ content/{zh,en}/components/*.md
│   ├─ app/components/               # DemoBlock, ApiTable（读 gen-meta 产出）
│   └─ nuxt.config.ts
└─ docs/PLAN.md                      # 本文
```

单包但两个入口：`.` 是组件，`./ink` 是特效引擎。组件默认自带水墨皮肤；想要"无皮肤"用 CSS layer：`@import "shuimo-ui/style.css" layer(m)` 后用户自己 `@layer m.ink { }` 覆盖，或者根本不引 `m.ink` 层。这就是 headless 的替代，不再维护第二套组件。

---

## 4. 特效引擎 `src/ink/`（这次的核心）

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
Stamp（印章）

**删除并说明**
Printer：它是 console.log 的样式封装，不是 UI 组件，不进组件库；文档站需要的话放 docs 本地。

Web Component 版（MWCBorder / MWCRicePaper）不做：旧版在 import 时就 `customElements.define`，SSR 直接炸。需要时用 `defineCustomElement` 单独出一个入口，不进 1.0。

---

## 6. 主题与 token

- `colors.css`：45 个传统色变量名原样继承（`--m-color-songlan` 菘蓝、`--m-color-luozidai` 螺子黛…），五行阴阳别名保留。这是品牌资产。
- `tokens.css`：语义层 `--m-fg / --m-bg / --m-paper / --m-ink / --m-accent / --m-danger / --m-radius / --m-space-* / --m-font-*`，组件只用语义 token，不直接用传统色。
- 暗色：`:root[data-theme="dark"]` + `color-scheme: dark`，`prefers-color-scheme` 兜底；不再用 `html[dark]` 属性，不再对贴图 `invert(1)`（因为没有贴图了）。
- `@layer m.reset, m.tokens, m.base, m.component, m.ink`：用户覆盖样式不用堆选择器。

---

## 7. 质量与流程

- 类型：`vue-tsc --declaration --emitDeclarationOnly` → tsdown `dts` 合并成单文件；`vp pack` 后跑 `attw`（arethetypeswrong）校验。
- API 元数据：`scripts/gen-meta.ts` 用 vue-component-meta 扫每个 SFC → `web-types.json`（IDE 提示）+ `docs/api/*.json`（文档 API 表）。JSDoc 写在 `types.ts` 上一次，两边共用。
- 单测：vitest 4 browser mode（Chromium），每组件一个 test；ink 引擎测 seed 复现性（同 seed 输出字节一致）。
- 视觉回归：Playwright 对 playground 每组件 × light/dark × reduced-motion 截图，`maxDiffPixelRatio: 0.002`；ink 引擎固定 seed 保证可比。
- Lint/格式：`vp check`（oxlint + oxfmt），配置沿用 shuimo-core 根 `vite.config.ts` 的写法。
- 提交：Conventional Commits，changesets 生成 CHANGELOG，`release.yml` 发 npm + GitHub Release。
- 文档站：Nuxt 4 + Content，`<DemoBlock>` 用 MDC 语法嵌 `demos/*.vue` 并显示源码（shiki 内置于 Content），字体由 font-subset 插件在构建期出 woff2。部署先上 Vercel 预览，域名归属定了再切。

---

## 8. 里程碑

| 阶段                       | 内容                                                                                                             | 出口标准                                                                                                                                                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 骨架（1 周）            | 仓库、vp 工具链、CI、changesets、tokens、colors、layers、playground、docs 空站；**shuimo-core benchmark 出数字** | `pnpm i && vp check && vp test && vp pack` 全绿；benchmark 报告 —— **2026-09-08 完成**，见 §4                                                                                                                                                                                                |
| M1 特效引擎（2 周）        | `ink/` 八个模块 + RicePaper + Border + Stamp + DarkMode                                                          | playground 首页：程序化宣纸 + 山 + 视差 + 墨晕，tier 0/1/2 可切，首屏 JS < 150KB gzip —— **进行中（2026-09-08）**：paper / landscape / parallax / bleed / MRicePaper 已完成并有浏览器测试；stroke / reveal / transition / MBorder / MInkTransition 也已完成；stamp / MStamp / MDarkMode 未做 |
| M2 基础组件（3 周）        | base 16 个 + Icon + Divider + Loading + ConfigProvider                                                           | 每个有 test + 截图基线 + 文档页                                                                                                                                                                                                                                                              |
| M3 消息与模板（3 周）      | message 6 个 + template 11 个 + Scrollbar + VirtualList                                                          | 同上；Dialog/Drawer 接 View Transitions                                                                                                                                                                                                                                                      |
| M4 Nuxt 模块与发布（1 周） | `./nuxt`、`./resolver`、web-types、attw、1.0.0-alpha 发 npm                                                      | 一个干净的 Nuxt 4 项目和一个 Vite 项目各跑通                                                                                                                                                                                                                                                 |
| M5 文档站上线（1 周）      | zh/en 全部组件页、色板页、ink 引擎调参页                                                                         | Lighthouse 性能 ≥ 90                                                                                                                                                                                                                                                                         |

总计约 11 周单人节奏。
