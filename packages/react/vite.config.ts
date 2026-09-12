import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

// 和 Vue 包同一条规矩：开发和测试直接吃 core 的源码。
// resolve.conditions 是替换不是追加，默认那几条必须原样带上，否则 react 的 exports
// 会退回错误的入口，一个进程里出现两份 React。
const SOURCE = ["@shuimo-design/source", "module", "browser", "development|production"];
const SOURCE_SSR = ["@shuimo-design/source", "module", "node", "development|production"];

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
    exclude: ["@shuimo-design/core"],
  },

  pack: {
    entry: {
      index: "src/index.ts",
      ink: "src/ink/index.ts",
    },
    format: ["esm"],
    platform: "neutral",
    // JSX 由 tsconfig 的 "jsx": "react-jsx" 决定，rolldown 底下的 oxc 会读它，
    // 不需要额外插件，pack 这里也没有对应的选项可配
    dts: { sourcemap: false },
    deps: {
      // 显式数组（函数形式会让 dts 插件丢掉入口名）；react 的子路径要逐个列，
      // 字符串 external 只精确匹配，不会自动覆盖 react/jsx-runtime。
      // core 必须 external：墨迹引擎是文档级单例，打进来一份单例就失效了
      neverBundle: [
        "react",
        "react/jsx-runtime",
        "react-dom",
        "react-dom/client",
        "@shuimo-design/core",
      ],
      dts: { neverBundle: true },
    },
    // 样式全在 core，这里只复制它的产物
    copy: [{ from: "../core/dist/style.css" }],
    clean: true,
    sourcemap: false,
    outDir: "dist",
  },

  resolve: { conditions: SOURCE },
  ssr: { resolve: { conditions: SOURCE_SSR } },
  test: {
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./test/setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright(),
      // 和 Vue 包同一个视口：默认的 414px 会把横向排布的组件挤出屏幕
      viewport: { width: 1280, height: 800 },
      instances: [{ browser: "chromium" }],
    },
  },
});
