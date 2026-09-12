import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";

// 开发时直接吃三个包的源码，不用先 pnpm build；打包仍然走 dist，
// 顺带让线上站成为 exports 出口的冒烟测试。
// 注意 resolve.conditions 是替换不是追加，默认那几条要原样带上，
// 否则 Vue / React 自己的 exports 会退回错误的入口，一个页面里出现两份框架。
const SOURCE = ["@shuimo-design/source", "module", "browser", "development|production"];

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    // 只接管 .tsx。配合"JSX 只写在 .tsx 里"的约定，两个插件按扩展名分流，永远不会撞
    react({ include: [/\.tsx$/] }),
  ],
  resolve: { conditions: command === "serve" ? SOURCE : [] },
  optimizeDeps: {
    exclude: ["@shuimo-design/core", "@shuimo-design/vue", "@shuimo-design/react"],
    include: ["vue", "react", "react-dom", "react-dom/client", "react/jsx-runtime"],
  },
  // 三个入口：/ 是分岔口（静态一页），/vue/ 和 /react/ 各是一个独立的单框架应用。
  // 分成两个 HTML 而不是一个应用里切换，模块图才是分开的 —— Vue 版的产物里一行 React 都没有，
  // 反过来也一样，谁都不会被对方的运行时拖累。
  build: {
    rollupOptions: {
      input: {
        index: here("index.html"),
        vue: here("vue/index.html"),
        react: here("react/index.html"),
      },
    },
  },
  server: { port: 5180 },
}));
