---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MRate 评分。

- `v-model` 是 0 ~ count 的数，`allowHalf` 时可为 .5；`allowClear`（默认开）再点当前值归零
- 每格一枚墨点，水墨层换成按 `seed` + 下标派生的毛边墨团，同一组里每格略不同；`character` 插槽 / `renderCharacter` 自定义每一格
- `role="radiogroup"` + 每格 `role="radio"`，整组只有一个 Tab 停靠点；方向键增减一档（半格时半档）、Home 归零、End 满分
- `texts` 显示每档文字，悬停预览时跟着预览值变；`hoverChange` 报预览值，离开为 0
- `readonly` 只展示、`disabled` 退出 Tab 序列；悬停 / 落值 / 键盘调值都在 core 的 `createRate` 控制器里

新增 MImage 图片。

- `src` 必填；`fit` 对应 object-fit，`width` / `height` 数字按 px；`lazy` 用原生 `loading="lazy"`
- 加载中显示 `placeholder` 插槽 / `renderPlaceholder`（默认一块 MSkeletonItem），失败显示 `error` 插槽 / `renderError`（默认「加载失败」）；`load` / `error` 事件
- 点击（或回车）打开全屏预览：放大、缩小、旋转、还原、上一张 / 下一张、关闭，滚轮缩放，← → 切图，Esc 或点遮罩关闭；`previewSrcList` 给列表、`initialIndex` 定起点，循环翻页；`show` / `close` 事件；`preview={false}` 关掉
- 预览层传送到 body、服务端不渲染；滚动锁 / Esc / 焦点存还复用弹窗的模态层；状态机在 core 的 `createImagePreview`；关闭钮借用弹窗的挂牌墨皮
- 新增内部图标 `rotate`、`restore`
