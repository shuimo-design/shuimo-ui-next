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

新增 MDescriptions 描述列表。

- `items` 传数据，或用 `MDescriptionsItem` 子组件按书写顺序声明；`title` / `extra` 组成头部；
- `column` 默认 3，`span` 占多列：超过列数截到列数、超过本行剩余截到剩余、最后一条补满本行，换行和截断是 core 的纯函数并有测试；
- `layout` 横排（标签值并排）/ 竖排（标签一行、值在下一行）；`size` 三档内边距；`colon` 默认开，只在横排不带格线时显示；
- 作用域插槽 `label` / `value`（React 是 `renderLabel` / `renderValue`）统一自定义所有格子；
- 语义是 `<dl>` / `<dt>` / `<dd>`，布局用 CSS grid，每格的行列位置由 core 算好写成内联样式；`bordered` 的横线是跨整行的元素，水墨层换成按实际宽度生成的淡墨笔触线（口径同表格的行间线）。
