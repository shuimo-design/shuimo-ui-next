# 从 shuimo-ui 0.3.x 迁移到 next

next 是重写版：所有水墨素材改为程序化 SVG（仓库里没有任何位图），并且**同时支持 Vue 3 和 React**。

包名变了，分成三个：`@shuimo-design/core`（全部逻辑与样式，零框架依赖）、`@shuimo-design/vue`、`@shuimo-design/react`。**旧的 `@shuimo-design/ui` 不再存在，也没有别名** —— 它没发过 npm，不需要过渡期。Vue 用户把 import 从 `@shuimo-design/ui` 改成 `@shuimo-design/vue`、样式改成 `@shuimo-design/vue/style.css` 即可，组件名和 props 不变。

组件名和大部分 props 沿用旧库，下面只列**行为或名字变了**的地方。没列出的组件（如 MDivider、MConfigProvider 之外的大多数 props）按旧文档写就能跑。

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

## 双框架改造带来的改动（2026-09）

这一轮把库拆成了「无头核心 + Vue/React 两层薄壳」，`@shuimo-design/ui` 变成三个包。下面这些是**在 next 内部**又变了一次的地方，从 0.3.x 迁过来的人直接看新写法即可。

### 表格 / 标签页 / 栅格：改成传数据

旧写法靠子组件在 setup 时登记自己，父组件再比 DOM 位置排序。这条路在 React 里不是「难做」是「做不了」：effect 的执行顺序在 Fragment / Suspense / 并发切片下不保证跟 DOM 顺序一致，服务端渲染时压根没有 DOM，只能等挂载后重排一次 —— 首帧顺序是错的，水合会闪。

所以三个组件统一改成**传数组**，顺序就是数组顺序：

```vue
<MTabs
  v-model="active"
  :panes="[{ name: 'shan', label: '山', content: () => h('p', '远山如黛') }]"
/>
<MTable :data="rows" :columns="[{ prop: 'name', label: '节气', align: 'left' }]" />
<MGrid :gap="10" :cells="[{ key: 'a', border: true, content: () => '春江潮水连海平' }]" />
```

子组件写法作为**语法糖保留**：两边各有一段约 25 行的收集函数，在**渲染期**读 children 的 props 拿到完整有序配置，不碰 DOM。`MTabPane` / `MTableColumn` 因此退化成零渲染的标记组件（不再往 DOM 里放隐藏占位元素）。

|                                                          | 旧                                        | 新                                                         |
| -------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| 表格列字段                                               | `param`                                   | **`prop`**（DOM 上 `data-param` 也跟着变成 `data-prop`）   |
| 表格列类型                                               | `TableColumnDef`                          | `TableColumnConfig`（没留别名）                            |
| 表格单元格插槽                                           | `cell-<param>` / `head-<param>`           | 列配置上的 `render` / `renderHead`，两个框架同一个函数签名 |
| 标签页元素 id                                            | 每个 pane 自己的 `useId` + `-tab`/`-pane` | MTabs 的 id + 下标（aria 指向关系不变）                    |
| `MTabPane` 不写 `name`                                   | 落生成的 uid                              | 落**书写位置的下标**（数字）                               |
| `.m-table__columns` 隐藏容器、`.m-tab-pane` 子组件根元素 | 存在                                      | 不再渲染（靠这两个选择器做事情的会失效）                   |

### 消息 / 确认框：必须在树里放一个渲染出口

旧实现用 `createVNode + render + vnode.appContext` 往 body 手挂一棵树，`useMessage()` / `useConfirm()` 存在的唯一理由就是偷偷把 `getCurrentInstance().appContext` 记成模块级全局 —— React 里没有任何对等物。

现在队列在 core，消息和确认框渲染在**你自己的组件树里**：读得到你的 provider、DevTools 看得见。代价是树里要有一个出口。

- **`useMessage()` / `useConfirm()` 删除**。直接 `MMessage.success("...")` / `await MConfirm.show("...")`，形状不变。
- 应用根部放一个 `<MConfigProvider>`（自带出口）或 `<MOverlayOutlet />`。没有出口时开发模式会 `console.warn` 一次，不会静默失灵。
- `createMessage(getContext)` → `createMessageQueue()`；`createConfirm(getContext)` → `createConfirmQueue()`。自建队列要另配一个出口：`<MOverlayOutlet :messages="q" />`。
- `MMessageList` 不再公开导出，也不再被 `createShuimo()` 全局注册（它是出口内部用的容器）。
- `MConfirm` 换成和弹窗、抽屉共用的模态控制器：**多了滚动锁、模态栈、焦点存还、Tab 循环**；ESC 改成在 document 上按栈顶层判定。事件顺序也改了：先 `confirm`/`cancel`，**后** `update:open`（旧版相反）。
- `ConfirmProps.mask` 从 `ConfirmMask` 放宽成 `boolean | ConfirmMask`；新增 `closeOnEsc`（默认 true）。

### 表单

- **`useFormItem()` 换形**：`FormItemContext | undefined`（字段是 `Ref`）→ `ComputedRef<FormItemContextValue>`（字段是纯值，有默认值兜底、**不再返回 undefined**）。script 里写 `formItem.value.id`，**模板里写 `formItem.id`**（模板会自动解包，写 `.value` 会拿到 undefined）。
- `FormContext` / `FormField` 删除，改用 core 的 `FormContextValue` / `FormFieldHandle`；`removeField` 去掉，`addField` 改为返回注销函数。
- `FormItemExpose` 不再有 `validateState` / `validateMessage`（那是 Ref 形状，进不了 core），只剩 `validate` / `resetField` / `clearValidate`。
- 外部 `error` prop 改成**渲染期的纯派生**：`error` 非空一律显示为错误态。清掉 `error` 之后不再顺手把校验状态清零，而是退回它原本的状态。这样两边都不用 watch，服务端渲染时接口返回的错误也不会丢（watch 方案在 React 里只能写成 effect，慢一帧，服务端更是根本不跑）。
- 「已在报错就全量复核」的判据从 `state === "error"` 改成 `message !== ""`；校验期间错误文字不再消失。**这修掉了一个真 bug**：失焦时会连着跑 change 和 blur 两次校验，第二次进来时状态已是 `validating`，判据漏掉，于是 blur 那次把错误清掉、错误框消失一帧又冒出来，下面的按钮上下跳，mousedown 和 mouseup 落到不同元素上，点击事件根本不产生。

### 其他

- `MStamp` 的 `stretch` 原来因为 Vue 的布尔转型恒为 `false`，现在按文档透传 `undefined`：方章 / 圆章 / 多边形章的字会撑满格子。
- `MScroll` 的 `defineExpose` 里 `view` 从模板 ref 改成函数 `view()`。
- `MRicePaper` 不传 `seed` 时的随机数从 setup 挪到了挂载之后：服务端和水合首帧固定用种子 1（首帧本来就是纯色纸，看不出区别），否则两边会抽到两张不同的纸。
- `@vueuse/core` 依赖整个去掉了（只用到 4 个函数，在 core 里重写不到 100 行）。
