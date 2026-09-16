---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

feat: add MVirtualTree

- 可见节点摊平后交给 MVirtualList 的控制器：定高 / 变高、buffer、滚动补偿同一套。
- 树逻辑复用 MTree 的 core 函数，props / 事件 / 插槽同形；新增 `scrollToKey`。
- 目标行不在渲染窗口时（Home / End、scrollToKey）先滚过去再聚焦；焦点行被滚出窗口时焦点落到容器，方向键送回。
- 行皮肤抽成 MTree / MVirtualTree 共用的 `tree-row` 块。**MTree 行类名变更**：`m-tree-node__row / __arrow / __checkbox / __label` → `m-tree-row / m-tree-row__arrow / __checkbox / __label`，状态类 `m-tree-row--selected` 等落在行上；外层 `m-tree-node` 不变。
- React MTree 改用 MCheckbox；MCheckbox 新增 `onClick`。
- 修：`style/MTree` 按需入口漏了 checkbox.css。
