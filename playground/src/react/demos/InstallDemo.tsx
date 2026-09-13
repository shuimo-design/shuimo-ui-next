/** 安装页。代码块是死的文本，写成常量免得 JSX 里满屏转义 */
const install = `pnpm add @shuimo-design/react
# 或 npm i @shuimo-design/react / yarn add @shuimo-design/react`;

const clone = `git clone https://github.com/shuimo-design/shuimo-ui-next.git
cd shuimo-ui-next
pnpm install
pnpm dev          # 文档站起在 localhost:5180`;

const main = `import { createRoot } from "react-dom/client";
import App from "./App";

// 1. 样式：JS 里不带样式，必须自己显式引一次
import "@shuimo-design/react/style.css";
// 2. 墨迹引擎：不调就只有骨架，没有毛边、笔触和印泥
import { createInkEngine } from "@shuimo-design/core/ink";

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

const preload = `import { createInkEngine, preloadStampFont } from "@shuimo-design/core/ink";

createInkEngine();
void preloadStampFont();`;

export default function InstallDemo() {
  return (
    <article className="guide">
      <p className="guide__lead">
        水墨风组件库，同一套核心同时支持 Vue 3 和 React。这一页讲怎么把它接进你的项目。
      </p>

      <div className="guide__note">
        <strong>还没发到 npm。</strong>
        三个包都已经打好 <code>1.0.0-alpha.0</code>，但还没推上去 —— 现在 <code>npm i</code>{" "}
        装不到。想先试，把仓库克隆下来跑文档站：
        <pre className="guide__code">{clone}</pre>
      </div>

      <h3 className="guide__h">装哪个包</h3>
      <p>
        用 React 就只装 <code>@shuimo-design/react</code>。逻辑、样式、墨迹生成都在{" "}
        <code>@shuimo-design/core</code> 里，它是这个包的依赖，会跟着装上，
        <strong>不用单独装</strong>。
      </p>
      <pre className="guide__code">{install}</pre>
      <p className="guide__hint">
        需要 React 18 或 19。纯 ESM，没有 CommonJS 产物。Vue 项目请装{" "}
        <code>@shuimo-design/vue</code>，看 <a href="../vue/#/install">Vue 版的这一页</a>。
      </p>

      <h3 className="guide__h">接进项目：两行</h3>
      <pre className="guide__code">{main}</pre>
      <p className="guide__hint">
        样式是一整份，不按组件拆；<code>@shuimo-design/react/style.css</code> 和{" "}
        <code>@shuimo-design/core/style.css</code> 是同一份文件的两个名字，引哪个都行。
      </p>
      <p className="guide__hint">
        不调 <code>createInkEngine()</code> 也能用：那样只剩骨架（盒模型、间距、状态），
        毛边和笔触不出现。想要一个规矩的组件库而不是水墨风，可以就这么用。
      </p>

      <h3 className="guide__h">用组件</h3>
      <p>直接 import，不用任何 provider，也不用配按需引入的插件。</p>
      <pre className="guide__code">{use}</pre>
      <p className="guide__hint">
        按需引入是天然的：产物一个源文件一份，只用一个组件比空应用多 6 ~ 8 KB（压缩 + gzip）， 47
        个组件全用上也才 93 KB。
      </p>
      <p className="guide__hint">
        Vue 的 <code>v-model</code> 在这边是受控 / 非受控两套都支持的一组 prop：
        <code>v-model:open</code> 对应 <code>open</code> + <code>onOpenChange</code> +{" "}
        <code>defaultOpen</code>。具名插槽对应渲染属性。每个组件页的 API 表写的就是 React
        这一套叫法。
      </p>

      <h3 className="guide__h">消息和确认框要有个出口</h3>
      <p>
        <code>MMessage.success()</code>、<code>MConfirm.show()</code> 这类函数式调用，
        渲染在你自己的组件树里（不再偷偷往 body 上挂），所以树里要有一个{" "}
        <code>&lt;MOverlayOutlet&gt;</code>。最外层套一个 <code>&lt;MConfigProvider&gt;</code>{" "}
        就自带了：
      </p>
      <pre className="guide__code">{overlay}</pre>

      <h3 className="guide__h">印章要用自己的篆体</h3>
      <p>
        库不打包字体。自己 <code>@font-face</code> 引好，再把 <code>--m-font-seal</code> 指过去：
      </p>
      <pre className="guide__code">{font}</pre>
      <p>
        然后启动时拉一次。<strong>这步省不掉</strong>
        ：浏览器只在真有元素用到某个字体时才去下载它， 光写 <code>@font-face</code>{" "}
        一个字节都不会拉，不预加载就会看到印章先排一版再跳一下。
      </p>
      <pre className="guide__code">{preload}</pre>

      <h3 className="guide__h">服务端渲染</h3>
      <p>
        Next.js 这类 React SSR 都支持。弹层类组件（对话框、抽屉、浮层、消息）不进服务端 HTML，
        挂载之后才出现 —— 两个框架统一这个口径。首帧是没有墨迹的朴素版，挂载后根元素加上{" "}
        <code>m-ink-ready</code> 才升级成水墨皮，所以水合不会不匹配。
      </p>
    </article>
  );
}
