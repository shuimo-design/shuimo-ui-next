# @shuimo-design/core

水墨风组件库的**无框架内核**：状态控制器、几何与墨迹生成、以及全部样式。不含任何框架代码。

> **1.0.0-beta.0，预发布版。** API 还可能改，改动会写在 [CHANGELOG](./CHANGELOG.md) 里。

一般不用直接装它 —— 它是 [`@shuimo-design/vue`](https://www.npmjs.com/package/@shuimo-design/vue) 和 [`@shuimo-design/react`](https://www.npmjs.com/package/@shuimo-design/react) 的依赖，装哪个壳它就跟着来。

**文档：<https://shuimo-ui-next.vercel.app>**

## 里面是什么

- **墨迹引擎**（`@shuimo-design/core/ink`）：程序化宣纸与远山、笔触边框、印章、擦入转场，全部现算成 SVG / data URI，确定性种子驱动，没有位图也没有字体。
- **状态控制器**：模态、浮层定位、表单校验、虚拟列表、消息队列这些状态机，做成框架无关的 `{ getSnapshot, subscribe, update, connect }` 形状，两个壳各写十几行胶水接上去。
- **全部样式**：7000 行 CSS，一份 `style.css`，两个壳共用。分 `@layer m.component`（骨架）和 `@layer m.ink`（水墨皮）两层。

自己写第三个框架的壳，或者只想要墨迹生成器（比如往 canvas 上画宣纸），可以直接用这个包。

```ts
import { createInkEngine, paperTextureUrl, generateStamp } from "@shuimo-design/core/ink";
```

需要显式引一次样式：`import "@shuimo-design/core/style.css"`。纯 ESM。

## 许可

MIT
