import { defineConfig } from "vite-plus";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  // 出库：tsdown（rolldown）。core 里没有 SFC，也没有 JSX，不需要任何框架插件。
  pack: {
    entry: {
      index: "src/index.ts",
      ink: "src/ink/index.ts",
    },
    format: ["esm"],
    platform: "neutral",
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
