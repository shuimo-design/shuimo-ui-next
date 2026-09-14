# @shuimo-design/react

水墨风 React 组件库。宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG —— 包里没有位图，也没有字体。

> **预发布版（1.0.0-beta.x）。** API 还可能改，每一版改了什么写在 [CHANGELOG](./CHANGELOG.md) 里。

**文档：<https://shuimo-ui-next.vercel.app/react/>**（Vue 版在 [/vue/](https://shuimo-ui-next.vercel.app/vue/)）

## 安装

```bash
pnpm add @shuimo-design/react
```

逻辑、样式、墨迹生成都在 `@shuimo-design/core` 里，它是这个包的依赖，会跟着装上，不用单独装。需要 React 18 或 19，纯 ESM。

## 用

```tsx
// main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";

// 样式是单独一份，JS 里不带，必须自己引一次
import "@shuimo-design/react/style.css";
// 墨迹引擎：不调就只剩骨架样式，毛边和笔触不出现。
// 从这个包的 /ink 引，别引 @shuimo-design/core：pnpm 下 core 不是你项目的直接依赖，解析不到
import { createInkEngine } from "@shuimo-design/react/ink";

createInkEngine();
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

直接 import 就行，不用任何 provider，也不用配按需引入的插件：产物一个源文件一份，只用一个组件比空应用多 6 ~ 8 KB（压缩 + gzip）。

组件名和 Vue 版完全一致。Vue 的 `v-model:open` 在这边是受控 / 非受控两套都支持的一组 prop：`open` + `onOpenChange` + `defaultOpen`；具名插槽对应渲染属性。

`MMessage.success()` 这类函数式调用渲染在你自己的组件树里，所以树里要有一个 `<MOverlayOutlet>` —— 最外层套一个 `<MConfigProvider>` 就自带了。

支持服务端渲染（Next.js）；弹层类组件不进服务端 HTML，挂载后才出现。

## 许可

MIT
