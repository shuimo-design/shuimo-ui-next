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

新增 MBackTop 回到顶部。

- props：`target`（选择器或返回元素的函数，默认整页）、`visibilityHeight`（默认 200）、`right` / `bottom`（默认 40，数字按 px、字符串原样用）、`seed`；事件 `click`；默认插槽换按钮内容。
- 默认外观是一枚印文「顶」的阴文小方印，由 MStamp 渲染、种子固定；出现淡入上浮，消失原路退回。
- 滚动监听、可见性判断、目标解析都在 core 的控制器里；点击用原生 `scrollTo({ behavior: "smooth" })`，减弱动效时瞬时到位。按钮传送到 body，`type="button"`、`aria-label="回到顶部"`，服务端不渲染。
