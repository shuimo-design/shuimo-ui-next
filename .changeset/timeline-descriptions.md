---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MTimeline 时间线。

- `items` 传数据，或用 `MTimelineItem` 子组件按书写顺序声明，两种写法产出同一份配置；
- `mode` 三种：`left`（轴在左）、`right`（轴在右）、`alternate`（内容左右交替）；`pending` 在末尾加一段虚线和幽灵节点，传字符串就是幽灵节点旁的文字；`reverse` 倒序；
- `type` 五种节点色：`primary` / `success` / `warn` / `danger` / `muted`；`dot` 传一个字，节点变成带字的圈；
- 作用域插槽 `dot` / `item`（React 是 `renderDot` / `renderItem`）统一自定义节点和整条内容；
- 整个列表是一张 CSS grid，轴线是跨行的一个元素，两端正好落在首尾节点圆心，不量 DOM；水墨层把轴线换成按实际高度生成的竖向笔触线，墨点换成毛边墨团，带字的圈换成一笔圆相。
