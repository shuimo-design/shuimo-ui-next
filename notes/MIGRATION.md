# 从 shuimo-ui 0.3.x 迁移到 next

next 是重写版：Vue 3.5 SFC、单包 `@shuimo-design/ui`、所有水墨素材改为程序化 SVG（仓库里没有任何位图）。组件名和大部分 props 沿用旧库，下面只列**行为或名字变了**的地方。没列出的组件（如 MDivider、MConfigProvider 之外的大多数 props）按旧文档写就能跑。

通用改动：

- 双向绑定统一用 `v-model`（`defineModel`），旧的 `visible` / `checked` / `isActive` 这类各自为政的开关 prop 一律并进 v-model。
- 布尔 prop 不带 `is` / `on` 前缀（`isRotate` → `rotate`，`onControl` → `controlled`）。
- 尺寸枚举统一 `sm | md | lg`（旧 `small | default | large`）。
- 状态色枚举统一 `default | primary | success | warn | danger`（旧 `confirm` → `success`，`error` → `danger`，`warning` → `warn`；MButton 保留旧的五个名字，见下）。
- Teleport 相关 prop 统一 `teleport: boolean | string`（旧 `{ to: 'body' }`）。
- 函数式调用的组件（消息、确认框）改为 `X.show(config)` / `useX().show(config)`，因为 `MX` 现在是组件对象。
- 全局主题：只认 `html[data-theme="dark" | "light" | "system"]`，不再有 `html[dark]`；默认亮色，不跟随系统。

## 基础组件

| 组件               | 旧                                          | 新                                                                                                                | 说明                                 |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| MButton            | `link: boolean`                             | `href: string`                                                                                                    | 有 href 就渲染 `<a>`                 |
| MButton            | type 值                                     | `default / primary / confirm / error / warning / text`                                                            | 与旧库一致；新库早期的 `cancel` 已删 |
| MButton            | `--m-button-h`                              | `--m-button-height`，另有 `--m-button-width / --m-button-color / --m-button-bg-color / --m-button-bg-hover-color` | 与旧文档一致                         |
| MInput             | `modelValue: string \| number`              | `string`                                                                                                          | 回写永远是字符串                     |
| MInput             | `input` 事件参数是 `Event`                  | 参数是 `string`                                                                                                   | 与 `change` 一致                     |
| MInput             | `type: input \| textarea`                   | 原生 type 值 + `textarea`                                                                                         | `"input"` 改用 `"text"`（默认）      |
| MInputNumber       | `modelValue` 必填、可为 string              | `number \| undefined`                                                                                             | 空值明确                             |
| MInputNumber       | `precision` 默认 0（实际不限制）            | 默认不限制                                                                                                        | 与旧实际行为一致                     |
| MCheckbox / MRadio | `checked` 强制初值                          | 删除                                                                                                              | 用 v-model                           |
| MRadio             | `value` 可省略                              | 必填                                                                                                              | 单选无值无意义                       |
| MRadio             | `onClick(e, value)`                         | `change(value, event)`                                                                                            | 与 Checkbox 对齐                     |
| MRadio / MCheckbox | 文档里的 `lable`                            | `label`（可 `string \| number`）                                                                                  | 旧文档拼写错误                       |
| MSelect            | `readonly=false` 开启过滤                   | `filterable`                                                                                                      | 语义反了                             |
| MSelect            | `optionsH`                                  | `maxHeight`（px）                                                                                                 |                                      |
| MSelect            | `needFetch` + `fetch`                       | 只留 `fetch`                                                                                                      | 传了就滚到底自动拉取                 |
| MSelect            | `checkbox`                                  | 删除                                                                                                              | 旧实现从未渲染                       |
| MSelect            | `focus/blur(event, inputValue)`             | `focus/blur(event)`；输入文字走 `input` 事件                                                                      |                                      |
| MDatePicker        | —                                           | 写回一律是格式化字符串                                                                                            | 与旧行为一致，仅说明                 |
| MSwitch            | `activeInfo / inactiveInfo`（prop 与 slot） | `activeText / inactiveText`；slot `active / inactive`                                                             |                                      |
| MSwitch            | `onControl`                                 | `controlled`                                                                                                      | `on*` 在 Vue 里是事件约定            |
| MSlider            | 珠子可越出轨道两端                          | 珠子落在轨道内                                                                                                    | 还原旧样式，点击换算随之变           |
| MProgress          | 默认宽 100%、info 在右侧                    | 默认 187px（`--m-progress-w`）、文字压在条上                                                                      | 还原旧样式                           |
| MTag               | `confirm / error / warning`、`info`         | `success / danger / warn`；`info` 删除（蓝色由 `primary` 承担）                                                   |                                      |
| MTag               | `--m-tag-bg`                                | `--m-tag-color`（或 prop `color`）                                                                                |                                      |
| MAvatar            | `img`                                       | `src`                                                                                                             |                                      |
| MCollapse          | `line`                                      | `divider`                                                                                                         |                                      |
| MCollapse          | 默认插槽=标题、`#content`=内容              | `#title` / 默认插槽=内容                                                                                          |                                      |
| MCollapse          | `renderContext`                             | 删除                                                                                                              | 内容始终在 DOM 里参与高度动画        |
| MList              | 插槽作用域 `{ data }`                       | `{ item, index }`                                                                                                 |                                      |
| MLi                | `icon`                                      | MListItem `marker`                                                                                                |                                      |
| MTree              | `checkbox / config / node-click`            | `checkable / fieldNames / nodeClick`                                                                              |                                      |
| MTree              | `checkStrictly` 默认 true 表示联动          | 默认 false；true = 父子各自独立                                                                                   | 改回字面意思，默认行为不变           |

## 模版组件

| 组件              | 旧                                         | 新                                                                            | 说明                       |
| ----------------- | ------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------- |
| MBorder           | `top/right/bottom/left: boolean \| string` | 仅 `boolean`                                                                  |                            |
| MBorder           | `mask` 默认 true                           | 默认 false                                                                    | backdrop-filter 代价大     |
| MBorder           | `insteadMain`                              | 删除                                                                          | 根元素就是边框盒           |
| MRicePaper        | `type: cold/warm/default`                  | `paper` 预设                                                                  |                            |
| MRicePaper        | `mountain`                                 | `landscape`                                                                   | 默认开                     |
| MRicePaper        | `autoDarkMode`                             | 删除                                                                          | 主题统一走 data-theme      |
| MForm / MFormItem | 无校验                                     | 新增 `rules`、`validate() / resetFields() / clearValidate()`                  | 旧库无校验代码             |
| MFormItem         | `prop` 直接当 `<label for>`                | `for` 自动生成并写到控件上；`prop` 只是字段名                                 |                            |
| MForm             | `submit` 布尔控制 onsubmit                 | 总会 emit `submit`；`submit=false` 阻止原生提交                               |                            |
| MTable            | `paramClass` 开关                          | 每个 th/td 固定带 `data-param`                                                |                            |
| MTable            | `height` 固定高                            | `height` 是 max-height                                                        |                            |
| MTable            | 单元格插槽 `{ data, index }`               | `{ row, data, value, index, column }`                                         | 旧写法仍可用               |
| MPagination       | `v-model` / `defaultCurrent`               | `v-model:current`（默认 1）                                                   |                            |
| MPagination       | `pageSize` 只读                            | `v-model:page-size` + `sizeChange`                                            |                            |
| MPagination       | `foldedMaxPageBtn: number \| null`         | 只接受 `number`                                                               |                            |
| MBreadcrumb       | 字符串 provide key                         | `breadcrumbKey` InjectionKey                                                  | 内部实现，仅影响自定义子项 |
| MMenu             | `config`                                   | `fieldNames`                                                                  |                            |
| MMenu             | 数据里的 `isActive`                        | `v-model`（当前 key）+ `v-model:expandedKeys`                                 |                            |
| MMenu             | 默认插槽 `{ data }`                        | `#label="{ item, level }"`；默认插槽放手写 MMenuItem                          |                            |
| MMenu             | `checkbox / checkedKeys / checkStrictly`   | 删除                                                                          | 旧实现无效果               |
| MMenu             | `nodeClick(树节点)`                        | `nodeClick(MenuItem)`，另有 `change / expand`                                 |                            |
| MCell             | `style` prop、`a/b/c/d` 坐标模式           | 删除；只接受角度                                                              | 坐标模式从未实现           |
| MGrid             | `w/h` 写到栅格自身                         | 只作为格子默认宽高                                                            |                            |
| MVirtualList      | 只有 `list`                                | 新增 `itemHeight / estimatedItemHeight / buffer / height / itemKey / divider` |                            |

## 消息组件

| 组件                | 旧                                                   | 新                                                                       | 说明                                  |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------- |
| MMessage            | `MMessage(config)`，返回 `Promise<dom>`              | `MMessage.show(config)` / `useMessage()`，同步返回 `{ close(), closed }` | `.success/.warning/.info/.error` 照旧 |
| MMessage            | emit `closeDuration`                                 | `close`                                                                  |                                       |
| MMessage            | `dragConfig.triggerBoundary`                         | 删除                                                                     | 旧代码未读取                          |
| MMessage            | `duration < 0` 不自动关                              | `duration <= 0` 不自动关                                                 |                                       |
| MConfirm            | `MConfirm(config)`；点遮罩只隐藏、Promise 不 resolve | `MConfirm.show(config)`；点遮罩 / Esc → resolve(false)                   |                                       |
| MDialog / MDrawer   | `visible` / `v-model:visible`                        | `v-model`                                                                |                                       |
| MDrawer             | `drawerClass: string[]`                              | 直接写 `class`                                                           |                                       |
| MPopover / MTooltip | `hover: boolean`                                     | `trigger: hover \| click \| focus \| manual`                             |                                       |
| MPopover / MTooltip | `mountRender`、`popper` 配置、`#arrow` 插槽          | 删除 / `offset` / `arrow: boolean`                                       |                                       |
| MPopover / MTooltip | `open:popper / close:popper`                         | `visibleChange(open)`                                                    | 旧事件从未触发                        |

## 其他组件

| 组件                                         | 旧                                     | 新                                                                                                                             | 说明             |
| -------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| MLoading                                     | `size` 是 logo 倍数、`sideLength`      | `size` 是像素边长；`sideLength` 删除                                                                                           | logo 不存在了    |
| MLoading                                     | `mask` 默认 true                       | 默认 false                                                                                                                     |                  |
| MLoading                                     | `loadingDirective`                     | `vLoading`（已在 `createShuimo` 里注册为 `v-loading`）                                                                         |                  |
| MDarkMode                                    | `initHandler`                          | `storageKey?: string \| false`（内建持久化，键 `shuimo-theme`）                                                                |                  |
| MDarkMode                                    | `isRotate`                             | `rotate`                                                                                                                       |                  |
| MDarkMode                                    | 写 `html[dark]`                        | 写 `html[data-theme]`；默认不跟随系统，传 `auto-mode` 才跟随                                                                   |                  |
| `useDarkModeStorage(key)`                    | —                                      | `useDarkMode({ storageKey, autoMode, transition })`                                                                            |                  |
| `MShuimoConfig` / `createMUI({ svgInject })` | —                                      | `MConfigProvider` + `useConfig()`；`svgInject` 删除                                                                            | 没有 symbol 集了 |
| MSvgWrapper / MSvgIcon / MSvgSymbol          | —                                      | 单个 `MSvg`（`name / ink / seed / size / color / rotate / spin`）                                                              |                  |
| `MPrinter(name)` 控制台打印器                | —                                      | `createPrinter(name)`；`MPrinter` 现在是打字机组件                                                                             |                  |
| MScroll                                      | 用户自己设 overflow；`--scrollbar-w/h` | 结构 `.m-scroll > __view > __content`；`height / maxHeight` prop；`--m-scroll-size / --m-scroll-line / --m-scroll-thumb-color` |                  |
| MDeleteIcon                                  | 无 props                               | `kind: brush \| cross`、`size / disabled / label / seed`                                                                       |                  |
