# @shuimo-design/vue

水墨风 Vue 3 组件库。宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG —— 包里没有位图，也没有字体。

> **预发布版（1.0.0-beta.x）。** API 还可能改，每一版改了什么写在 [CHANGELOG](./CHANGELOG.md) 里。

**文档：<https://shuimo-ui-next.vercel.app/vue/>**（React 版在 [/react/](https://shuimo-ui-next.vercel.app/react/)）

## 安装

```bash
pnpm add @shuimo-design/vue
```

逻辑、样式、墨迹生成都在 `@shuimo-design/core` 里，它是这个包的依赖，会跟着装上，不用单独装。需要 Vue ^3.5，纯 ESM。

## 用

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";

// 样式是单独一份，JS 里不带，必须自己引一次
import "@shuimo-design/vue/style.css";
// 墨迹引擎：不调就只剩骨架样式，毛边和笔触不出现。
// 从这个包的 /ink 引，别引 @shuimo-design/core：pnpm 下 core 不是你项目的直接依赖，解析不到
import { createInkEngine } from "@shuimo-design/vue/ink";

createInkEngine();
createApp(App).mount("#app");
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MButton, MDialog } from "@shuimo-design/vue";
const open = ref(false);
</script>

<template>
  <MButton type="primary" @click="open = true">落笔</MButton>
  <MDialog v-model="open" title="山水">墨分五色。</MDialog>
</template>
```

直接 import 就行，不用 `app.use()` 注册，也不用配按需引入的插件：产物一个源文件一份，只用一个组件比空应用多 6 ~ 8 KB（压缩 + gzip）。

`MMessage.success()` 这类函数式调用渲染在你自己的组件树里，所以树里要有一个 `<MOverlayOutlet>` —— 最外层套一个 `<MConfigProvider>` 就自带了。

另有两个入口：`@shuimo-design/vue/nuxt`（Nuxt 模块）、`@shuimo-design/vue/resolver`（配合 unplugin-vue-components 自动引入）。

支持服务端渲染；弹层类组件不进服务端 HTML，挂载后才出现。

## 许可

MIT
