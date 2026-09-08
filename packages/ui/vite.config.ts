import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import VueRolldown from "unplugin-vue/rolldown";
import { playwright } from "@vitest/browser-playwright";

/**
 * shuimo-core 主入口带一个副作用式 `import "fontkit"`（印章字体用），worker 里用不到。
 * 打进 worker 时把它替换成空模块，避免 worker 文件里留下裸包名 import。
 */
/** worker 入口及其生成逻辑：这些文件里引用的 shuimo-core 必须打进产物 */
const isWorkerSource = (file: string) => /\/src\/ink\/[^/]+\/(worker|generate)\.ts$/.test(file);

const stubFontkit = {
  name: "shuimo:stub-fontkit",
  resolveId(id: string) {
    return id === "fontkit" ? "\0stub:fontkit" : null;
  },
  load(id: string) {
    return id === "\0stub:fontkit" ? "export default {};" : null;
  },
};

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: [
      "vue",
      "@vueuse/core",
      "@jobinjia/shuimo-core",
      "@jobinjia/shuimo-core/xuan-paper/worker",
    ],
  },

  // 出库：tsdown（rolldown）。SFC 由 unplugin-vue 编译，d.ts 由 vue-tsc 产出。
  pack: {
    entry: {
      index: "src/index.ts",
      ink: "src/ink/index.ts",
      nuxt: "src/nuxt/module.ts",
      resolver: "src/resolver.ts",
      "paper-worker": "src/ink/paper/worker.ts",
      "landscape-worker": "src/ink/landscape/worker.ts",
    },
    format: ["esm"],
    platform: "neutral",
    plugins: [VueRolldown({ isProduction: true }), stubFontkit],
    alias: { fontkit: "./src/ink/stubs/empty.ts" },
    dts: { vue: true, sourcemap: false },
    deps: {
      // tsdown 默认把 package.json 里声明过的依赖全部外部化（不问 neverBundle），
      // 所以 shuimo-core（peerDependency）要靠 alwaysBundle 拉回 worker 入口里。
      alwaysBundle: (id: string, importer?: string) =>
        id.startsWith("@jobinjia/shuimo-core") && !!importer && isWorkerSource(importer),
      // 外部依赖用显式数组：函数形式会让 dts 插件丢掉入口名（ink.d.ts 变 index2.d.ts），
      // `true` 又会把未声明的 fontkit 直接外部化而不经过 alias。
      // shuimo-core 不写在这里：它作为 peerDependency 默认就是外部的，而 alwaysBundle 只能
      // 覆盖这条"声明过的依赖"规则，覆盖不了显式数组。数组之外的包（fontkit、shuimo-core
      // 内部依赖）正常解析：fontkit 命中 alias 变空模块，其余按需打进 worker。
      neverBundle: ["vue", "@nuxt/kit", "@nuxt/schema", "@vueuse/core", "@floating-ui/vue"],
      dts: { neverBundle: true },
    },
    clean: true,
    sourcemap: false,
    outDir: "dist",
  },

  // 组件测试跑在真 Chromium 里：滤镜、canvas、ResizeObserver 在 happy-dom 里测不了
  test: {
    // BENCH=1 时额外跑 bench/ 下的浏览器基准（需要 OffscreenCanvas / Worker，Node 里跑不了）
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
