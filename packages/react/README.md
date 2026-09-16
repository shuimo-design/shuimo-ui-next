# @shuimo-design/react

水墨风 React 组件库。宣纸、远山、毛边、笔触、印章都是运行时生成的 SVG，包里没有位图和字体。

文档：<https://shuimo-ui-next.vercel.app/react/>（Vue 版：[/vue/](https://shuimo-ui-next.vercel.app/vue/)）

当前 `1.0.0-beta.x`，API 可能变，见 [CHANGELOG](./CHANGELOG.md)。

## 安装

```bash
pnpm add @shuimo-design/react
```

React 18 / 19，纯 ESM。

## 用法

```tsx
// main.tsx
import "@shuimo-design/react/style.css";
import { createInkEngine } from "@shuimo-design/react/ink"; // ink 从壳包引；core 不是直接依赖，pnpm 下解析不到
import { createRoot } from "react-dom/client";
import App from "./App";

createInkEngine(); // 不调则只有骨架样式，没有毛边和笔触
createRoot(document.getElementById("root")!).render(<App />);
```

```tsx
import { useState } from "react";
import { MButton, MDialog } from "@shuimo-design/react";

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MButton type="primary" onClick={() => setOpen(true)}>
        落笔
      </MButton>
      <MDialog open={open} onOpenChange={setOpen} title="山水">
        墨分五色。
      </MDialog>
    </>
  );
}
```

组件名与 Vue 版一致；`v-model:x` 对应 `x` / `onXChange` / `defaultX`，受控非受控都支持；具名插槽对应 render prop。`MMessage.success()` 等函数式 API 渲染在组件树里，树中需要一个 `<MOverlayOutlet>`，`<MConfigProvider>` 内含一个。

SSR（Next.js）支持；弹层类组件不进服务端 HTML。

## 样式按需

`style.css` 整份 22 KB gzip。按组件引时去掉它，改为：

```ts
import "@shuimo-design/react/style/MButton";
import "@shuimo-design/react/style/MDialog";
```

`style/<Name>` 是副作用入口，import base（层顺序、变量、reset、图标、墨迹动画）+ 该组件内部渲染的组件 + 自己的 css，重复由打包器按模块去重。散件在 `@shuimo-design/react/css/<name>.css`。

自动补样式用 [vite-plugin-imp](https://github.com/onebay/vite-plugin-imp)：

```ts
// vite.config.ts
import vitePluginImp from "vite-plugin-imp";

export default defineConfig({
  plugins: [
    react(),
    vitePluginImp({
      libList: [
        {
          libName: "@shuimo-design/react",
          camel2DashComponentName: false,
          replaceOldImport: false, // 组件仍从包入口引，插件只加样式 import
          style: (name) => `@shuimo-design/react/style/${name}`,
        },
      ],
    }),
  ],
});
```

babel-plugin-import 在 Vite 下无效：它匹配 `createElement()` 调用，而 Vite 的 JSX 转换在 babel 之后。

## 许可

MIT
