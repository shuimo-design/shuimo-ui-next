---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

MTable 补列排序与行选择。

- 列上 `sortable: true` 按 `row[prop]` 用默认比较（数字按数值、字符串 localeCompare、空值排最后），也可以给比较函数；`MTableColumn` 同步加 `sortable`
- 表头点一下升序、再点降序、第三下取消；可排序列的表头是真按钮，键盘可达，`aria-sort` 标在 `<th>` 上；指示器两枚小三角，水墨层把点亮的那枚换成墨点
- `v-model:sort` / React `sort` + `onSortChange` + `defaultSort`，`sortChange` 事件；`sortRemote` 时不在本地排只发事件，给服务端排序用
- 排序纯函数 `sortTableRows` 在 core，返回带原下标的行，按下标算的 rowKey 排序后不变
- `selection="multiple" | "single"` 在第一列插入 MCheckbox；表头全选 / 半选只算 `selectable` 为 true 的行；点行不改选中态，只有点勾选框才改
- `v-model:selectedKeys` / React `selectedKeys` + `onSelectedKeysChange` + `defaultSelectedKeys`，按 `rowKey` 记；`selectionChange` / `select` / `selectAll` 事件
- 选中行加 `m-table__row--selected` 和 `aria-selected`，水墨层铺一层淡墨；选择状态的纯函数 `tableSelectionState` / `toggleTableSelection` / `toggleAllTableSelection` 在 core
- 新增内部图标 `caret-up`、`caret-down`
