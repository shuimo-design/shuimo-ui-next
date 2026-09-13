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
  // 测试期用得到的依赖要**全**列出来，`@floating-ui/dom` 尤其不能漏 —— 它是 core 的依赖，
  // 而 core 被 exclude 掉、按源码提供，vite 初次扫描看不到它，要等某个测试真的引到才
  // 现场预构建，然后 "optimized dependencies changed. reloading"，正在飞的那几个动态
  // import 当场以 "Failed to fetch dynamically imported module" 整个文件加载失败。
  // 表现是随机几个测试文件挂掉，冷缓存（CI 每次都是）必现
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "vitest-browser-react",
      // 写成 "A > B" 是 vite 给这种情况准备的语法：B 不是本包的依赖，解析不到，
      // 要告诉它从 A 里面找
      "@shuimo-design/core > @floating-ui/dom",
    ],
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
