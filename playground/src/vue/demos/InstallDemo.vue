<script setup lang="ts">
/** 安装页。代码块是死的文本，写成常量免得模板里满屏转义 */
const version = __SHUIMO_VERSION__;

const install = `pnpm add @shuimo-design/vue
# 或 npm i @shuimo-design/vue / yarn add @shuimo-design/vue`;

const main = `import { createApp } from "vue";
import App from "./App.vue";

// 1. 样式：JS 里不带样式，必须自己显式引一次
import "@shuimo-design/vue/style.css";
// 2. 墨迹引擎：不调就只有骨架，没有毛边、笔触和印泥。
// ink 从壳包引；core 不是直接依赖，pnpm 下解析不到
import { createInkEngine } from "@shuimo-design/vue/ink";

createInkEngine();
createApp(App).mount("#app");`;

// SFC 的块是扫文本切出来的：字符串里直接写 script 的开闭标签会被当成真标签，
// 整个文件就解析不了（实测 oxfmt 报 Unexpected closing tag）。拆成变量拼
const S = "script";
const use = `<${S} setup lang="ts">
import { MButton, MDialog } from "@shuimo-design/vue";
const open = ref(false);
</${S}>

<template>
  <MButton type="primary" @click="open = true">落笔</MButton>
  <MDialog v-model="open" title="山水">墨分五色。</MDialog>
</template>`;

const overlay = `<template>
  <MConfigProvider>
    <RouterView />
  </MConfigProvider>
</template>`;

const font = `@font-face {
  font-family: "我的篆体";
  src: url("/fonts/my-seal.woff2") format("woff2");
  font-display: swap;
}
:root {
  --m-font-seal: "我的篆体", serif;
}`;

const onDemand = `// vite.config.ts
import Components from "unplugin-vue-components/vite";
import { ShuimoResolver } from "@shuimo-design/vue/resolver";

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [ShuimoResolver({ importStyle: true })] })],
});`;

const onDemandManual = `import "@shuimo-design/vue/style/MButton";
import "@shuimo-design/vue/style/MDialog";`;

const preload = `import { createInkEngine, preloadStampFont } from "@shuimo-design/vue/ink";

createInkEngine();
void preloadStampFont();`;
</script>

<template>
  <article class="guide">
    <p class="guide__lead">Vue 3 和 React 共用一套核心的水墨风组件库。这一页是接入步骤。</p>

    <div class="guide__note">
      当前 <strong>{{ version }}</strong
      >，预发布。API 可能变，见各包 CHANGELOG。
    </div>

    <h3 class="guide__h">安装</h3>
    <pre class="guide__code">{{ install }}</pre>
    <p class="guide__hint">
      Vue ^3.5，纯 ESM。React 项目见
      <a href="../react/#/install">React 版</a>。
    </p>

    <h3 class="guide__h">接入</h3>
    <pre class="guide__code">{{ main }}</pre>
    <p class="guide__hint">
      <code>style.css</code> 是整份样式（22 KB gzip），按需见下节。不调
      <code>createInkEngine()</code> 则只有 <code>@layer m.component</code>
      的骨架样式，没有毛边和笔触。
    </p>

    <h3 class="guide__h">使用</h3>
    <p>全局注册用 <code>app.use(createShuimo())</code>。</p>
    <pre class="guide__code">{{ use }}</pre>
    <p class="guide__hint">
      JS 一个源文件一个产物，import 即按需；单个组件比空应用多 6 ~ 8 KB（压缩 + gzip）。
    </p>

    <h3 class="guide__h">样式按需</h3>
    <p>
      去掉 <code>main.ts</code> 里的 <code>style.css</code>，配 unplugin-vue-components 的
      resolver：
    </p>
    <pre class="guide__code">{{ onDemand }}</pre>
    <p>或手动引入口：</p>
    <pre class="guide__code">{{ onDemandManual }}</pre>
    <p class="guide__hint">
      <code>style/&lt;Name&gt;</code> 是副作用入口：base（层顺序、变量、reset、图标、墨迹动画）+
      该组件内部渲染的组件 + 自己的 css，打包器按模块去重。散件在
      <code>@shuimo-design/vue/css/&lt;name&gt;.css</code>。<code>MMessage.success()</code>
      这类函数式调用 resolver 看不到，其样式随 <code>&lt;MConfigProvider&gt;</code> 的入口进来。
    </p>

    <h3 class="guide__h">函数式 API 的出口</h3>
    <p>
      <code>MMessage.success()</code>、<code>MConfirm.show()</code> 渲染在你的组件树里，树中需要一个
      <code>&lt;MOverlayOutlet&gt;</code>，<code>&lt;MConfigProvider&gt;</code> 内含一个：
    </p>
    <pre class="guide__code">{{ overlay }}</pre>

    <h3 class="guide__h">印章字体</h3>
    <p>库不带字体。<code>@font-face</code> 引好后把 <code>--m-font-seal</code> 指过去：</p>
    <pre class="guide__code">{{ font }}</pre>
    <p>
      启动时调一次 <code>preloadStampFont()</code>。<code>MStamp</code>
      用 canvas 量字排版，字体在首枚印章绘制后才开始下载的话会重排一次。
    </p>
    <pre class="guide__code">{{ preload }}</pre>

    <h3 class="guide__h">SSR</h3>
    <p>
      Vue SSR / Nuxt 支持。弹层类（对话框、抽屉、浮层、消息）不进服务端 HTML；首帧无墨迹，挂载后
      <code>&lt;html&gt;</code> 加 <code>m-ink-ready</code> 再升级，水合一致。
    </p>

    <h3 class="guide__h">Vue 专有入口</h3>
    <p>
      <code>@shuimo-design/vue/nuxt</code>：Nuxt 模块，注入整份样式。
      <code>@shuimo-design/vue/resolver</code>：unplugin-vue-components 的 resolver，
      <code>importStyle</code> 开启时样式也按需。
    </p>
  </article>
</template>
