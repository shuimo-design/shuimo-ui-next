# @shuimo-design/core

shuimo-ui 的无框架内核：状态控制器、几何与墨迹生成、全部样式。不含框架代码。

文档：<https://shuimo-ui-next.vercel.app>

当前 `1.0.0-beta.x`，API 可能变，见 [CHANGELOG](./CHANGELOG.md)。

## 内容

- `@shuimo-design/core/ink`：宣纸、远山、笔触边框、印章、擦入转场，seed 驱动的确定性 SVG / data URI。
- 控制器：模态、浮层定位、表单校验、虚拟列表、消息队列等，统一 `{ getSnapshot, getServerSnapshot, subscribe, update, connect, disconnect }` 接口。
- 样式：`style.css` 整份，`css/*.css` 按组件散件，`@layer m.component`（骨架）与 `@layer m.ink`（水墨皮）两层。`@shuimo-design/core/styles` 导出按需清单（`COMPONENT_STYLES` / `styleFilesOf`）。

适用于给第三个框架写壳，或单独使用墨迹生成器：

```ts
import { createInkEngine, paperTextureUrl, generateStamp } from "@shuimo-design/core/ink";
```

样式需自己引：`import "@shuimo-design/core/style.css"`。纯 ESM。

## 许可

MIT
