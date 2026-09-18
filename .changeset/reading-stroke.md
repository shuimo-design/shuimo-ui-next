---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MReadingStroke 一笔书进度：阅读进度 = 随页面滚动写完的一根笔触，固定在视口顶部（或底部）。

- 状态由 core 控制器 `createReadingStroke` 持有：目标解析（选择器 / 元素 / 函数，默认整页）、滚动和 resize 监听、进度换算；服务端快照恒为 0
- 笔触用 `brushLineUrl` 按视口实际宽度（64px 分桶）生成当遮罩，进度用 clip-path 从左往右揭开；支持 `mask-composite` 的浏览器再叠一层横向渐变让笔尖化开，不支持的直接按进度截宽
- 没有墨迹引擎时是一条实墨；`role="progressbar"` + `aria-valuenow`（整数百分点）
- `change` 事件只在跨过整数百分点时触发；`seed` / `position` / `target` / `thickness` / `color` / `zIndex`
