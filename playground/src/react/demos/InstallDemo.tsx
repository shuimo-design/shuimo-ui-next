/** 安装页。代码块是死的文本，写成常量免得 JSX 里满屏转义 */
const version = __SHUIMO_VERSION__;

const install = `pnpm add @shuimo-design/react
# 或 npm i @shuimo-design/react / yarn add @shuimo-design/react`;

const main = `import { createRoot } from "react-dom/client";
import App from "./App";

// 1. 样式：JS 里不带样式，必须自己显式引一次
import "@shuimo-design/react/style.css";
// 2. 墨迹引擎：不调就只有骨架，没有毛边、笔触和印泥。
// ink 从壳包引；core 不是直接依赖，pnpm 下解析不到
import { createInkEngine } from "@shuimo-design/react/ink";

createInkEngine();
createRoot(document.getElementById("root")!).render(<App />);`;

const use = `import { useState } from "react";
import { MButton, MDialog } from "@shuimo-design/react";

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MButton type="primary" onClick={() => setOpen(true)}>落笔</MButton>
      <MDialog open={open} onOpenChange={setOpen} title="山水">墨分五色。</MDialog>
    </>
  );
}`;

const overlay = `<MConfigProvider>
  <App />
</MConfigProvider>`;

const font = `@font-face {
  font-family: "我的篆体";
  src: url("/fonts/my-seal.woff2") format("woff2");
  font-display: swap;
}
:root {
  --m-font-seal: "我的篆体", serif;
}`;

const onDemandManual = `import "@shuimo-design/react/style/MButton";
import "@shuimo-design/react/style/MDialog";`;

const onDemand = `// vite.config.ts
import vitePluginImp from "vite-plugin-imp";

export default defineConfig({
  plugins: [
    react(),
    vitePluginImp({
      libList: [
        {
          libName: "@shuimo-design/react",
          camel2DashComponentName: false,
          // 组件照旧从包入口引（入口本身可摇树），插件只补样式那一行
          replaceOldImport: false,
          style: (name) => \`@shuimo-design/react/style/\${name}\`,
        },
      ],
    }),
  ],
});`;

const preload = `import { createInkEngine, preloadStampFont } from "@shuimo-design/react/ink";

createInkEngine();
void preloadStampFont();`;

export default function InstallDemo() {
  return (
    <article className="guide">
      <p className="guide__lead">Vue 3 和 React 共用一套核心的水墨风组件库。这一页是接入步骤。</p>

      <div className="guide__note">
        当前 <strong>{version}</strong>，预发布。API 可能变，见各包 CHANGELOG。
      </div>

      <h3 className="guide__h">安装</h3>
      <pre className="guide__code">{install}</pre>
      <p className="guide__hint">
        React 18 / 19，纯 ESM。Vue 项目见 <a href="../vue/#/install">Vue 版</a>。
      </p>

      <h3 className="guide__h">接入</h3>
      <pre className="guide__code">{main}</pre>
      <p className="guide__hint">
        <code>style.css</code> 是整份样式（22 KB gzip），按需见下节。不调{" "}
        <code>createInkEngine()</code> 则只有 <code>@layer m.component</code>{" "}
        的骨架样式，没有毛边和笔触。
      </p>

      <h3 className="guide__h">使用</h3>
      <pre className="guide__code">{use}</pre>
      <p className="guide__hint">
        JS 一个源文件一个产物，import 即按需；单个组件比空应用多 6 ~ 8 KB（压缩 + gzip）。
      </p>
      <p className="guide__hint">
        组件名与 Vue 版一致。<code>v-model:x</code> 对应 <code>x</code> / <code>onXChange</code> /{" "}
        <code>defaultX</code>，受控非受控都支持；具名插槽对应 render prop。API 表按 React 写法显示。
      </p>

      <h3 className="guide__h">样式按需</h3>
      <p>
        去掉 <code>main.tsx</code> 里的 <code>style.css</code>，按组件引入口：
      </p>
      <pre className="guide__code">{onDemandManual}</pre>
      <p className="guide__hint">
        <code>style/&lt;Name&gt;</code> 是副作用入口：base（层顺序、变量、reset、图标、墨迹动画）+
        该组件内部渲染的组件 + 自己的 css，打包器按模块去重。散件在{" "}
        <code>@shuimo-design/react/css/&lt;name&gt;.css</code>。
      </p>
      <p>
        自动补样式用 vite-plugin-imp，按 <code>import {"{ MButton, MDialog }"}</code>{" "}
        的名单每个加一行：
      </p>
      <pre className="guide__code">{onDemand}</pre>
      <p className="guide__hint">
        babel-plugin-import 在 Vite 下无效：它匹配 <code>createElement()</code> 调用，而 Vite 的 JSX
        转换在 babel 之后。
      </p>

      <h3 className="guide__h">函数式 API 的出口</h3>
      <p>
        <code>MMessage.success()</code>、<code>MConfirm.show()</code>{" "}
        渲染在你的组件树里，树中需要一个 <code>&lt;MOverlayOutlet&gt;</code>；
        <code>&lt;MConfigProvider&gt;</code> 内含一个：
      </p>
      <pre className="guide__code">{overlay}</pre>

      <h3 className="guide__h">印章字体</h3>
      <p>
        库不带字体。<code>@font-face</code> 引好后把 <code>--m-font-seal</code> 指过去：
      </p>
      <pre className="guide__code">{font}</pre>
      <p>
        启动时调一次 <code>preloadStampFont()</code>。<code>MStamp</code> 用 canvas
        量字排版，字体在首枚印章绘制后才开始下载的话会重排一次。
      </p>
      <pre className="guide__code">{preload}</pre>

      <h3 className="guide__h">SSR</h3>
      <p>
        Next.js 等 React SSR 支持。弹层类（对话框、抽屉、浮层、消息）不进服务端
        HTML；首帧无墨迹，挂载后 <code>&lt;html&gt;</code> 加 <code>m-ink-ready</code>{" "}
        再升级，水合一致。
      </p>
    </article>
  );
}
