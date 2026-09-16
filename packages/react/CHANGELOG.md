# @shuimo-design/react

## 1.0.0-beta.3

### Minor Changes

- [`e44d121`](https://github.com/shuimo-design/shuimo-ui-next/commit/e44d121afd3c03f2943113d0a8affb98bb4d8e17) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MDropdown 下拉菜单：

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

- [`3a1bd6a`](https://github.com/shuimo-design/shuimo-ui-next/commit/3a1bd6a936f8799a3c6266bba8ff45a954968471) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MNotification 通知。

  - 函数式调用：`MNotification.open(config)`、`.success / .info / .warning / .error(config | string)`、`.closeAll(placement?)`；`open()` 返回 `{ close, closed }` 句柄，和 MMessage 同一套形状。传字符串就是标题。
  - 配置：`title`、`content`、`type`、`duration`（默认 4500，0 不自动关）、`closable`（默认开）、`placement`（四个角，默认右上）、`onClose`。
  - 通知由 `<MOverlayOutlet>`（`<MConfigProvider>` 自带）渲染，四个角各一栈，新通知从外侧滑入，鼠标悬停暂停倒计时；队列在 core 的 `notification`，出口新增 `notifications` 属性可接独立队列。
  - 也导出组件 `<MNotification>` 供直接放在页面上；error 用 `role="alert"`，其余 `role="status"`。
  - 外观按 MCard 的边框口径做成一张小卡，徽记复用 MAlert / MMessage 的素材，关闭是 MDeleteIcon 的叉；开了墨迹引擎后换成毛边宣纸。

  新增 MBackTop 回到顶部。

  - props：`target`（选择器或返回元素的函数，默认整页）、`visibilityHeight`（默认 200）、`right` / `bottom`（默认 40，数字按 px、字符串原样用）、`seed`；事件 `click`；默认插槽换按钮内容。
  - 默认外观是一枚印文「顶」的阴文小方印，由 MStamp 渲染、种子固定；出现淡入上浮，消失原路退回。
  - 滚动监听、可见性判断、目标解析都在 core 的控制器里；点击用原生 `scrollTo({ behavior: "smooth" })`，减弱动效时瞬时到位。按钮传送到 body，`type="button"`、`aria-label="回到顶部"`，服务端不渲染。

- [`d673572`](https://github.com/shuimo-design/shuimo-ui-next/commit/d67357291ffbc89de48df2e474bca0c0f117eb7e) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MPaperTheme 宣纸主题：一排纸样，一键切换整站的纸色和纹理。

  - 五种预设：raw 生宣、processed 熟宣、antique 古色、teaStained 茶染、moonWhite 月白；`presets` 选要展示的，`labels` 改显示名，`size` 三档
  - 切纸就是往 `<html>` 写 `data-paper` 和纸面变量（`--m-paper-rgb` / `--m-paper` / `--m-bg` / `--m-paper-theme-texture`），根元素铺上纸色，开了墨迹引擎再铺纹理；深色主题下只记 `data-paper` 不写变量，转回亮色再补上
  - `v-model:preset`（React：`preset` / `onPresetChange` / `defaultPreset`），`change` 事件；默认记到 localStorage（键 `shuimo-paper`），`storage=false` 不记
  - `role="radiogroup"`，方向键 / Home / End 切换，服务端首帧不写属性
  - core 另导出 `applyPaperPreset()` / `clearPaperPreset()`，不用组件也能切
  - MRicePaper 没传 `paper` 时跟随全局的纸：现在也盯着 html 的内联 style 变化重读纸色

- [`c93cb33`](https://github.com/shuimo-design/shuimo-ui-next/commit/c93cb332fc3f5424e78053bb0ae911fe71e7d57d) Thanks [@JobinJia](https://github.com/JobinJia)! - feat: add MVirtualTree

  - 可见节点摊平后交给 MVirtualList 的控制器：定高 / 变高、buffer、滚动补偿同一套。
  - 树逻辑复用 MTree 的 core 函数，props / 事件 / 插槽同形；新增 `scrollToKey`。
  - 目标行不在渲染窗口时（Home / End、scrollToKey）先滚过去再聚焦；焦点行被滚出窗口时焦点落到容器，方向键送回。
  - 行皮肤抽成 MTree / MVirtualTree 共用的 `tree-row` 块。**MTree 行类名变更**：`m-tree-node__row / __arrow / __checkbox / __label` → `m-tree-row / m-tree-row__arrow / __checkbox / __label`，状态类 `m-tree-row--selected` 等落在行上；外层 `m-tree-node` 不变。
  - React MTree 改用 MCheckbox；MCheckbox 新增 `onClick`。
  - 修：`style/MTree` 按需入口漏了 checkbox.css。

- [`f68a08b`](https://github.com/shuimo-design/shuimo-ui-next/commit/f68a08b8996a467abe69fb5838742c3fb836793a) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MRate 评分。

  - `v-model` 是 0 ~ count 的数，`allowHalf` 时可为 .5；`allowClear`（默认开）再点当前值归零
  - 每格一枚墨点，水墨层换成按 `seed` + 下标派生的毛边墨团，同一组里每格略不同；`character` 插槽 / `renderCharacter` 自定义每一格
  - `role="radiogroup"` + 每格 `role="radio"`，整组只有一个 Tab 停靠点；方向键增减一档（半格时半档）、Home 归零、End 满分
  - `texts` 显示每档文字，悬停预览时跟着预览值变；`hoverChange` 报预览值，离开为 0
  - `readonly` 只展示、`disabled` 退出 Tab 序列；悬停 / 落值 / 键盘调值都在 core 的 `createRate` 控制器里

  新增 MImage 图片。

  - `src` 必填；`fit` 对应 object-fit，`width` / `height` 数字按 px；`lazy` 用原生 `loading="lazy"`
  - 加载中显示 `placeholder` 插槽 / `renderPlaceholder`（默认一块 MSkeletonItem），失败显示 `error` 插槽 / `renderError`（默认「加载失败」）；`load` / `error` 事件
  - 点击（或回车）打开全屏预览：放大、缩小、旋转、还原、上一张 / 下一张、关闭，滚轮缩放，← → 切图，Esc 或点遮罩关闭；`previewSrcList` 给列表、`initialIndex` 定起点，循环翻页；`show` / `close` 事件；`preview={false}` 关掉
  - 预览层传送到 body、服务端不渲染；滚动锁 / Esc / 焦点存还复用弹窗的模态层；状态机在 core 的 `createImagePreview`；关闭钮借用弹窗的挂牌墨皮
  - 新增内部图标 `rotate`、`restore`

- [`53edd49`](https://github.com/shuimo-design/shuimo-ui-next/commit/53edd492741791eca343f75632faaaa9cbfa99fc) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MSealColophon 落款：页脚 / 作品末尾的署名块，落款语 + 署名 + 日期，末字右下压一枚印章。

  - `author` 必填；`text` 落款语、`date` 原样显示；印文 `seal` 默认取署名前两个字，`sealShape` / `sealMode` / `sealSize` 递给 MStamp
  - `align` 靠左 / 靠右（默认右），`vertical` 竖排（writing-mode: vertical-rl，印章落在末字下面）
  - 默认插槽替换整段落款文，`seal` 插槽替换印章（React：`children` / `renderSeal`）
  - 落款文用 `--m-font-brush` 字体栈、淡墨、行距略大；印章种子默认固定，服务端和客户端盖的是同一枚；开了墨迹引擎时印泥略透、章略歪

- [`600ca83`](https://github.com/shuimo-design/shuimo-ui-next/commit/600ca8354d19a1137123f7be1c17014a7ff1b564) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MTimeline 时间线。

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

### Patch Changes

- Updated dependencies [[`e44d121`](https://github.com/shuimo-design/shuimo-ui-next/commit/e44d121afd3c03f2943113d0a8affb98bb4d8e17), [`3a1bd6a`](https://github.com/shuimo-design/shuimo-ui-next/commit/3a1bd6a936f8799a3c6266bba8ff45a954968471), [`d673572`](https://github.com/shuimo-design/shuimo-ui-next/commit/d67357291ffbc89de48df2e474bca0c0f117eb7e), [`c93cb33`](https://github.com/shuimo-design/shuimo-ui-next/commit/c93cb332fc3f5424e78053bb0ae911fe71e7d57d), [`f68a08b`](https://github.com/shuimo-design/shuimo-ui-next/commit/f68a08b8996a467abe69fb5838742c3fb836793a), [`53edd49`](https://github.com/shuimo-design/shuimo-ui-next/commit/53edd492741791eca343f75632faaaa9cbfa99fc), [`600ca83`](https://github.com/shuimo-design/shuimo-ui-next/commit/600ca8354d19a1137123f7be1c17014a7ff1b564)]:
  - @shuimo-design/core@1.0.0-beta.3

## 1.0.0-beta.2

### Minor Changes

- [`783b326`](https://github.com/shuimo-design/shuimo-ui-next/commit/783b326fc90860cb0a8a900c9995d08ab7883558) Thanks [@JobinJia](https://github.com/JobinJia)! - 样式可以按需引入了。`style.css` 仍是整份；不想全引就按组件引 `style/<组件名>` 入口（`@shuimo-design/vue/style/MButton`、`@shuimo-design/react/style/MButton`），一个入口把底子（`css/base.css`）、它内部渲染的组件和它自己的 css 一起带齐，重复引到的文件由打包器按模块去重。散件本身暴露在 `css/<名字>.css`。

  - Vue：`ShuimoResolver({ importStyle: true })` 配合 unplugin-vue-components，模板里写 `<MButton>` 就连样式一起自动引。
  - React：配 vite-plugin-imp 照 import 名单补样式；babel-plugin-import 在 Vite 里看不见 JSX，不适用。
  - core：`@shuimo-design/core/styles` 导出清单（`COMPONENT_STYLES`、`styleFilesOf`），两个壳的入口和 resolver 都从这里算。

  按需时不要再引 `style.css`，会重。Nuxt 模块仍是全量。

### Patch Changes

- Updated dependencies [[`783b326`](https://github.com/shuimo-design/shuimo-ui-next/commit/783b326fc90860cb0a8a900c9995d08ab7883558)]:
  - @shuimo-design/core@1.0.0-beta.2

## 1.0.0-beta.1

### Minor Changes

- MRadio / MRadioGroup / MCheckboxGroup / MCollapse / MSlider / MSelect 的 v-model（React 的 value / onValueChange）类型改成泛型，跟着绑定的值和形状属性走：

  - 单选组、复选组：绑 `ref("a")` / `ref<string[]>` 就推成 string，不再是 `string | number | boolean` 的宽联合
  - 折叠面板：写了 `accordion` 就是单个 name（全收起为 undefined），否则是数组
  - 滑块：写了 `range` 就是 `[起, 止]`，否则是一个数
  - 下拉：写了 `multiple` 就是数组，否则是"值 | undefined"（清空后为 undefined）

  对不上的用法（`range` 却绑一个数、`multiple` 却绑单值）现在是类型错误。以前把状态声明成 `SliderValue` / `CollapseModel` 这类并集的代码要改成精确类型（示例站已改）。文档里 v-model 的类型按不带参数的形状显示，和以前一致。

- MSwitch 的值类型改成泛型：不传 activeValue 时 v-model / value 就是 boolean，传了 `activeValue="night"` 就推成 string。之前是 `string | number | boolean` 的宽联合，Vue 开 strictTemplates 后 `v-model="ref(true)"` 会报类型错，React 侧 `onValueChange={setOn}` 也得手动收窄。

### Patch Changes

- README 里墨迹引擎的引入路径改成本包的 `/ink` 子路径。原来写的 `@shuimo-design/core/ink` 在 pnpm 项目里解析不到：core 只是本包的依赖，不是用户项目的直接依赖。
- Updated dependencies []:
  - @shuimo-design/core@1.0.0-beta.1

## 1.0.0-beta.0

### Major Changes

- 首个公开预发布版本。同一套核心，Vue 3 和 React 各一层薄壳，48 个组件两边都有。

  宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG，包里没有位图也没有字体。

  - `@shuimo-design/core` —— 无框架内核：状态控制器、几何与墨迹生成、全部样式。两个壳都依赖它，不用单独安装。
  - `@shuimo-design/vue` —— Vue 3 壳，另有 `./nuxt`（Nuxt 模块）和 `./resolver`（配合 unplugin-vue-components 自动引入）。
  - `@shuimo-design/react` —— React 壳，`v-model` 对应受控 / 非受控两套 prop，具名插槽对应渲染属性。

  样式是单独一份，必须显式 `import "@shuimo-design/vue/style.css"`；水墨皮肤在 `@layer m.ink` 里，由 `createInkEngine()` 打开，不调用就只有基础层。两边都支持服务端渲染，弹层类组件不进服务端 HTML。纯 ESM。

### Patch Changes

- Updated dependencies []:
  - @shuimo-design/core@1.0.0-beta.1
