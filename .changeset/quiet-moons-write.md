---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

feat: add MVirtualTree — a virtualized tree for large datasets

- 可见节点摊平成一列交给 MVirtualList 的控制器：定高 / 变高两种行高模式、buffer、滚动补偿全部同口径。
- 树逻辑（建树、展开集合、勾选联动、键盘导航）与 MTree 复用同一份 core 函数，props / 事件 / 插槽同形；新增 `scrollToKey` 按节点滚动。
- Home / End 这类跨窗口跳转：目标行不在渲染窗口时先滚过去，行挂上来后补聚焦。
- 顺手修了按需样式的漏项：`style/MTree` 之前不带 checkbox.css，勾选框会裸奔。
- 树的行皮肤抽成两棵树共用的 `tree-row` 样式块，行上的类名从 `m-tree-node__row / __arrow / __checkbox / __label` 改为 `m-tree-row / m-tree-row__arrow / __checkbox / __label`，选中 / 禁用 / 展开态也直接落在行上（`m-tree-row--selected` 等）；外层 `m-tree-node` 的类名不变。覆盖过行样式的要跟着改。
- React 的 MTree 改用 MCheckbox（之前是自己画的同款勾选框），MCheckbox 多了个 `onClick`。
