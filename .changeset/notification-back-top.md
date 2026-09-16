---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MNotification 通知。

- 函数式调用：`MNotification.open(config)`、`.success / .info / .warning / .error(config | string)`、`.closeAll(placement?)`；`open()` 返回 `{ close, closed }` 句柄，和 MMessage 同一套形状。传字符串就是标题。
- 配置：`title`、`content`、`type`、`duration`（默认 4500，0 不自动关）、`closable`（默认开）、`placement`（四个角，默认右上）、`onClose`。
- 通知由 `<MOverlayOutlet>`（`<MConfigProvider>` 自带）渲染，四个角各一栈，新通知从外侧滑入，鼠标悬停暂停倒计时；队列在 core 的 `notification`，出口新增 `notifications` 属性可接独立队列。
- 也导出组件 `<MNotification>` 供直接放在页面上；error 用 `role="alert"`，其余 `role="status"`。
- 外观按 MCard 的边框口径做成一张小卡，徽记复用 MAlert / MMessage 的素材，关闭是 MDeleteIcon 的叉；开了墨迹引擎后换成毛边宣纸。
