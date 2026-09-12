import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";

// 开发时直接吃三个包的源码，不用先 pnpm build；打包仍然走 dist，
// 顺带让线上站成为 exports 出口的冒烟测试。
// 注意 resolve.conditions 是替换不是追加，默认那几条要原样带上，
// 否则 Vue / React 自己的 exports 会退回错误的入口，一个页面里出现两份框架。
const SOURCE = ["@shuimo-design/source", "module", "browser", "development|production"];

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
  server: { port: 5180 },
}));
