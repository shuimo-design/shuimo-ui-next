import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";

// 开发时直接吃三个包的源码，不用先 pnpm build；打包仍然走 dist，
// 顺带让线上站成为 exports 出口的冒烟测试。
// 注意 resolve.conditions 是替换不是追加，默认那几条要原样带上，
// 否则 Vue 自己的 exports 会退回 CJS 入口，一个页面里出现两份 Vue。
const SOURCE = ["@shuimo-design/source", "module", "browser", "development|production"];

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  resolve: { conditions: command === "serve" ? SOURCE : [] },
  optimizeDeps: {
    exclude: ["@shuimo-design/core", "@shuimo-design/vue"],
  },
  server: { port: 5180 },
}));
