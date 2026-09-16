# @shuimo-design/vue

水墨风 Vue 3 组件库。宣纸、远山、毛边、笔触、印章都是运行时生成的 SVG，包里没有位图和字体。

文档：<https://shuimo-ui-next.vercel.app/vue/>（React 版：[/react/](https://shuimo-ui-next.vercel.app/react/)）

当前 `1.0.0-beta.x`，API 可能变，见 [CHANGELOG](./CHANGELOG.md)。

## 安装

```bash
pnpm add @shuimo-design/vue
```

Vue ^3.5，纯 ESM。

## 用法

```ts
// main.ts
import "@shuimo-design/vue/style.css";
import { createInkEngine } from "@shuimo-design/vue/ink"; // ink 从壳包引；core 不是直接依赖，pnpm 下解析不到
import { createApp } from "vue";
import App from "./App.vue";

createInkEngine(); // 不调则只有骨架样式，没有毛边和笔触
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

全局注册用 `app.use(createShuimo())`。`MMessage.success()` 等函数式 API 渲染在组件树里，树中需要一个 `<MOverlayOutlet>`，`<MConfigProvider>` 内含一个。

SSR 支持；弹层类组件不进服务端 HTML。另有 `@shuimo-design/vue/nuxt`（Nuxt 模块，目前注入整份样式）和 `@shuimo-design/vue/resolver`。

## 样式按需

`style.css` 整份 22 KB gzip。按组件引时去掉它，改为：

```ts
// vite.config.ts
import Components from "unplugin-vue-components/vite";
import { ShuimoResolver } from "@shuimo-design/vue/resolver";

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [ShuimoResolver({ importStyle: true })] })],
});
```

或手动：

```ts
import "@shuimo-design/vue/style/MButton";
import "@shuimo-design/vue/style/MDialog";
```

`style/<Name>` 是副作用入口，import base（层顺序、变量、reset、图标、墨迹动画）+ 该组件内部渲染的组件 + 自己的 css，重复由打包器按模块去重。散件在 `@shuimo-design/vue/css/<name>.css`。函数式 API 不是标签，resolver 看不到，其样式随 `MConfigProvider` / `MOverlayOutlet` 的入口一起进来。

## 许可

MIT
