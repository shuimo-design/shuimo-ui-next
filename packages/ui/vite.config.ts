import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import VueRolldown from "unplugin-vue/rolldown";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ["@floating-ui/vue", "vue", "@vueuse/core"],
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
    dts: { vue: true, sourcemap: false },
    deps: {
      // 外部依赖用显式数组：函数形式会让 dts 插件丢掉入口名（ink.d.ts 变 index2.d.ts）
      neverBundle: ["vue", "@nuxt/kit", "@nuxt/schema", "@vueuse/core", "@floating-ui/vue"],
      dts: { neverBundle: true },
    },
    clean: true,
    sourcemap: false,
    outDir: "dist",
  },

  // 组件测试跑在真 Chromium 里：滤镜、mask、ResizeObserver 在 happy-dom 里测不了
  test: {
    // BENCH=1 时额外跑 bench/ 下的浏览器样张脚本（把 SVG 渲染成图落盘供人眼检查）
    include: ["src/**/*.test.ts", ...(process.env.BENCH ? ["bench/**/*.browser.ts"] : [])],
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
