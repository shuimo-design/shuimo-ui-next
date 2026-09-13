import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import VueRolldown from "unplugin-vue/rolldown";
import { playwright } from "@vitest/browser-playwright";

// 自定义 exports 条件：开发和测试直接吃 core 的源码，不用先把 core 构建出来。
// 不用标准的 "development"，因为那个条件任何第三方的 dev 构建都会命中，
// 而发布出去的包里没有 src，用户会直接解析失败。
//
// 注意 resolve.conditions 是**替换**默认值不是追加：只写自己那一条，
// Vue 自己的 exports 就会退回 CJS 入口，一个进程里同时出现两份 Vue，
// useTemplateRef 会报 "Cannot define property row, object is not extensible"（2026-09-12 实测）。
const SOURCE = ["@shuimo-design/source", "module", "browser", "development|production"];
const SOURCE_SSR = ["@shuimo-design/source", "module", "node", "development|production"];

export default defineConfig({
  plugins: [vue()],
  // 同 react 包：测试期的依赖要全列，漏了会在跑到一半时触发重新预构建，
  // 正在飞的动态 import 直接失败（`@floating-ui/dom` 是 core 的依赖，core 被 exclude
  // 掉按源码提供，初次扫描扫不到它）。@vueuse/core 和 @floating-ui/vue 早就不用了，
  // 留在这里 vite 反而要去解析两个不存在的包
  optimizeDeps: {
    include: ["vue", "vitest-browser-vue", "@shuimo-design/core > @floating-ui/dom"],
    exclude: ["@shuimo-design/core"],
  },

  // 出库：tsdown（rolldown）。SFC 由 unplugin-vue 编译，d.ts 由 vue-tsc 产出。
  pack: {
    entry: {
      index: "src/index.ts",
      ink: "src/ink/index.ts",
      nuxt: "src/nuxt/module.ts",
      resolver: "src/resolver.ts",
    },
    format: ["esm"],
    platform: "neutral",
    plugins: [VueRolldown({ isProduction: true })],
    // 一个源文件出一个产物文件。合并成一个 index.js 的话，rolldown 会用 __exportAll
    // 在运行时把所有组件挂到一个对象上，使用方的打包器就静态分析不动了 —— 只用一个组件
    // 也要把整份产物连同 core 一起留下（实测多付约 45 KB gzip）
    unbundle: true,
    dts: { vue: true, sourcemap: false },
    deps: {
      // 外部依赖用显式数组：函数形式会让 dts 插件丢掉入口名（ink.d.ts 变 index2.d.ts）。
      // core 必须 external：墨迹引擎是文档级单例（全局 SVG 滤镜、素材登记表、html.m-ink-ready），
      // 打进来一份就等于 Vue 和 React 各持一套引擎，单例失效。
      neverBundle: ["vue", "@shuimo-design/core", "@nuxt/kit", "@nuxt/schema"],
      dts: { neverBundle: true },
    },
    // 样式全在 core，这里只把它的产物复制过来，用户装一个包就能 import "@shuimo-design/vue/style.css"
    copy: [{ from: "../core/dist/style.css" }],
    clean: true,
    sourcemap: false,
    outDir: "dist",
  },

  // 组件测试跑在真 Chromium 里：滤镜、mask、ResizeObserver 在 happy-dom 里测不了
  resolve: { conditions: SOURCE },
  ssr: { resolve: { conditions: SOURCE_SSR } },
  test: {
    // BENCH=1 时额外跑 bench/ 下的浏览器样张脚本（把 SVG 渲染成图落盘供人眼检查）
    include: ["src/**/*.test.ts", ...(process.env.BENCH ? ["bench/**/*.browser.ts"] : [])],
    setupFiles: ["./test/setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright(),
      // 默认的测试 iframe 只有 414px 宽，分页这类横向排布的组件会被挤出视口、
      // Playwright 点不到（2026-09-12 实测：尺寸下拉框被推到 x = -134）。给一个正常桌面宽度
      viewport: { width: 1280, height: 800 },
      instances: [{ browser: "chromium" }],
    },
  },
});
