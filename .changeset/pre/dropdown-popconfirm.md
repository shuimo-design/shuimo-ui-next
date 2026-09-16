---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MDropdown 下拉菜单：

- `items` 传菜单项（`key` / `label` / `disabled` / `divided` / `danger`），`trigger` 支持 click / hover，`placement` 默认 bottom-start
- `v-model:open`（React 为 `open` / `onOpenChange` / `defaultOpen`）双向绑定展开状态，不传也能用
- `select` 事件带 key 和整项，选中后自动收起；`item` 插槽（React 为 `renderItem`）自定义每一项
- 键盘：触发元素上 ArrowDown 打开并聚焦第一项，菜单内上下循环、Home / End、Enter / Space 选中、Esc 收起并把焦点还给触发元素；`role="menu"` / `menuitem` / `separator`
- 开合、定位、笔触边框复用气泡卡片那一套；新增 core 的 `createPopoverFocus`，负责浮层打开时送焦点、关闭时还焦点

新增 MPopconfirm 气泡确认：

- `title`（必填）、`content`、`confirmText` / `cancelText`（默认「确定」/「取消」）、`confirmType`（复用 ButtonType，默认 primary）、`placement` 默认 top、`icon` 控制标题左侧的提示徽记
- `v-model:open`（React 为 `open` / `onOpenChange` / `defaultOpen`），点触发元素自己开
- `confirm` / `cancel` 事件：点确定、取消都收起；点外面、Esc、再点触发元素都算一次 cancel，和 MConfirm 点遮罩的口径一致
- `title` / `content` 插槽（React 为 `renderTitle` / `renderContent`）；两个按钮用 MButton
- 打开后焦点落在取消按钮上，关闭时还给触发元素；`role="dialog"` + `aria-labelledby` 指向标题，触发元素带 `aria-haspopup="dialog"`
