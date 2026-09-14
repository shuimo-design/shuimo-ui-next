import { defineConfig } from "vite-plus";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  // 出库：tsdown（rolldown）。core 里没有 SFC，也没有 JSX，不需要任何框架插件。
  pack: {
    entry: {
      index: "src/index.ts",
      ink: "src/ink/index.ts",
      // 按需样式的清单，给两个壳的构建脚本和 Vue 的 resolver 用，跑在 Node 里
      styles: "src/styles/manifest.ts",
    },
    format: ["esm"],
    platform: "neutral",
    // 一个源文件出一个产物文件，不合并成几个大块。合并过的产物使用方摇不动：
    // index 和 ink 两个入口的公共部分会被提成一个 150 KB 的块，随便引一个组件就整块留下
    unbundle: true,
    // unbundle 打开后 CSS 默认也跟着拆，会变成 dist/styles/index.css。
    // 样式对外就是一份 dist/style.css（两个壳也是照着这个名字复制的），所以这里关掉拆分
    css: { splitting: false },
    dts: { sourcemap: false },
    deps: {
      // 外部依赖用显式数组：函数形式会让 dts 插件丢掉入口名（ink.d.ts 变 index2.d.ts）
      neverBundle: ["@floating-ui/dom"],
      dts: { neverBundle: true },
    },
    clean: true,
    sourcemap: false,
    outDir: "dist",
  },

  // 纯算法的测试跑 node，碰 DOM / CSSOM / 滤镜的跑真 Chromium（happy-dom 测不了 mask 和 ResizeObserver）
  test: {
    projects: [
      {
        test: {
          name: "core",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.dom.test.ts"],
        },
      },
      {
        test: {
          name: "core-dom",
          include: [
            "src/**/*.dom.test.ts",
            ...(process.env.BENCH ? ["bench/**/*.browser.ts"] : []),
          ],
          setupFiles: ["./test/setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
