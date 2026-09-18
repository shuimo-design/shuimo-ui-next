---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MShanShui 山水横幅：hero 用的一幅画，远山剪影分层 + 朱砂日 + 雁阵 + 孤舟，跟随滚动或鼠标做视差。

- 所有图形都是 seed 驱动的 SVG 遮罩：远山每层一张 `inkRidgeUrl`，日头、雁阵、孤舟是新加的 `inkSunUrl` / `inkGeeseUrl` / `inkBoatUrl`；同 seed 同一幅画，服务端和客户端首帧一致
- `layers` 远山层数 2–5，`sun` / `geese` / `boat` 各自可关；`palette` 三种配色（ink / dawn / dusk）只换 CSS 变量
- `parallax`：scroll 按横幅顶边越过视口顶边的距离算，页面在哪个容器里滚都一样；pointer 跟随鼠标；none 不动。prefers-reduced-motion 下自动不动
- 没有墨迹引擎时是纯色分层（远山是几块由深到浅的墩子，日头是个圆），`@layer m.ink` 才换成 SVG；tier 0 不生成 SVG
- `ready` 事件在全部遮罩图解码完成、画面淡入时触发一次
- `createParallax` 新增 `scrollOffset` 选项：自定义"滚了多远"的读法，传了就在捕获阶段听滚动，内层容器的滚动也收得到

新增 MReadingStroke 一笔书进度：阅读进度 = 随页面滚动写完的一根笔触，固定在视口顶部（或底部）。

- 状态由 core 控制器 `createReadingStroke` 持有：目标解析（选择器 / 元素 / 函数，默认整页）、滚动和 resize 监听、进度换算；服务端快照恒为 0
- 笔触用 `brushLineUrl` 按视口实际宽度（64px 分桶）生成当遮罩，进度用 clip-path 从左往右揭开；支持 `mask-composite` 的浏览器再叠一层横向渐变让笔尖化开，不支持的直接按进度截宽
- 没有墨迹引擎时是一条实墨；`role="progressbar"` + `aria-valuenow`（整数百分点）
- `change` 事件只在跨过整数百分点时触发；`seed` / `position` / `target` / `thickness` / `color` / `zIndex`
