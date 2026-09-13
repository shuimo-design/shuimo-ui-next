<script setup lang="ts">
/** 安装页。代码块是死的文本，写成常量免得模板里满屏转义 */
const install = `pnpm add @shuimo-design/vue
# 或 npm i @shuimo-design/vue / yarn add @shuimo-design/vue`;

const main = `import { createApp } from "vue";
import App from "./App.vue";

// 1. 样式：JS 里不带样式，必须自己显式引一次
import "@shuimo-design/vue/style.css";
// 2. 墨迹引擎：不调就只有骨架，没有毛边、笔触和印泥
import { createInkEngine } from "@shuimo-design/core/ink";

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

const preload = `import { createInkEngine, preloadStampFont } from "@shuimo-design/core/ink";

createInkEngine();
void preloadStampFont();`;
</script>

<template>
  <article class="guide">
    <p class="guide__lead">
      水墨风组件库，同一套核心同时支持 Vue 3 和 React。这一页讲怎么把它接进你的项目。
    </p>

    <div class="guide__note">
      <strong>当前是 1.0.0-beta.0，预发布版。</strong>
      API 还可能改，每次改动都记在各包的 CHANGELOG 里。直接
      <code>npm i</code> 装到的就是这个版本，不用加 <code>@beta</code>。
    </div>

    <h3 class="guide__h">装哪个包</h3>
    <p>
      用 Vue 就只装 <code>@shuimo-design/vue</code>。逻辑、样式、墨迹生成都在
      <code>@shuimo-design/core</code>
      里，它是这个包的依赖，会跟着装上，<strong>不用单独装</strong>。
    </p>
    <pre class="guide__code">{{ install }}</pre>
    <p class="guide__hint">
      需要 Vue ^3.5。纯 ESM，没有 CommonJS 产物。React 项目请装
      <code>@shuimo-design/react</code>，看 <a href="../react/#/install">React 版的这一页</a>。
    </p>

    <h3 class="guide__h">接进项目：两行</h3>
    <pre class="guide__code">{{ main }}</pre>
    <p class="guide__hint">
      样式是一整份，不按组件拆；<code>@shuimo-design/vue/style.css</code> 和
      <code>@shuimo-design/core/style.css</code> 是同一份文件的两个名字，引哪个都行。
    </p>
    <p class="guide__hint">
      不调 <code>createInkEngine()</code> 也能用：那样只剩骨架（盒模型、间距、状态），
      毛边和笔触不出现。想要一个规矩的组件库而不是水墨风，可以就这么用。
    </p>

    <h3 class="guide__h">用组件</h3>
    <p>直接 import，不用 <code>app.use()</code> 注册，也不用配按需引入的插件。</p>
    <pre class="guide__code">{{ use }}</pre>
    <p class="guide__hint">
      按需引入是天然的：产物一个源文件一份，只用一个组件比空应用多 6 ~ 8 KB（压缩 + gzip）， 47
      个组件全用上也才 106 KB。
    </p>

    <h3 class="guide__h">消息和确认框要有个出口</h3>
    <p>
      <code>MMessage.success()</code>、<code>MConfirm.show()</code> 这类函数式调用，
      渲染在你自己的组件树里（不再偷偷往 body 上挂），所以树里要有一个
      <code>&lt;MOverlayOutlet&gt;</code>。最外层套一个
      <code>&lt;MConfigProvider&gt;</code> 就自带了：
    </p>
    <pre class="guide__code">{{ overlay }}</pre>

    <h3 class="guide__h">印章要用自己的篆体</h3>
    <p>库不打包字体。自己 <code>@font-face</code> 引好，再把 <code>--m-font-seal</code> 指过去：</p>
    <pre class="guide__code">{{ font }}</pre>
    <p>
      然后启动时拉一次。<strong>这步省不掉</strong>：浏览器只在真有元素用到某个字体时才去下载它，
      光写 <code>@font-face</code> 一个字节都不会拉，不预加载就会看到印章先排一版再跳一下。
    </p>
    <pre class="guide__code">{{ preload }}</pre>

    <h3 class="guide__h">服务端渲染</h3>
    <p>
      Vue SSR 和 Nuxt 都支持。弹层类组件（对话框、抽屉、浮层、消息）不进服务端 HTML， 挂载之后才出现
      —— 两个框架统一这个口径。首帧是没有墨迹的朴素版， 挂载后根元素加上
      <code>m-ink-ready</code> 才升级成水墨皮，所以水合不会不匹配。
    </p>

    <h3 class="guide__h">Vue 独有的两个入口</h3>
    <p>
      <code>@shuimo-design/vue/nuxt</code> 是 Nuxt 模块（自动注入样式）；
      <code>@shuimo-design/vue/resolver</code> 配合 unplugin-vue-components 用， 让模板里写
      <code>&lt;MButton&gt;</code> 不用 import。
    </p>
  </article>
</template>
