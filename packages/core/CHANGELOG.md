# @shuimo-design/core

## 1.0.0-beta.4

### Minor Changes

- [`fe32329`](https://github.com/shuimo-design/shuimo-ui-next/commit/fe3232930ff1e08b84393a99973d9ae59d7162b2) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MCarousel 走马灯。
  
  - `items` 一项一张（`key` / `src` / `alt` / `render`），或用子组件 `MCarouselItem` 按书写顺序收集；每次只渲染当前那张，服务端输出没有 transform
  - `v-model:current` / React `current` + `onCurrentChange` + `defaultCurrent`；`change` 报新旧下标
  - `autoplay` true 每 4000ms 一张、传数字指定毫秒；悬停、焦点在里面时暂停，`prefers-reduced-motion` 下不自动播；计时器在 core 的 `createCarousel` 控制器里
  - `loop`（默认开）关掉后两头的箭头禁用；`direction="vertical"` 上下翻；`height` 定容器高度，不传由当前那张撑开
  - `indicator="dots"` 一排墨点（水墨层换成按 `seed` 生成的毛边墨团，激活的蘸朱砂）；`arrows` hover / always / none
  - 容器 `role="region"` + `aria-roledescription="carousel"`，可聚焦：← →（竖向 ↑ ↓）翻页，Home / End 到两头；自动播放时 `aria-live="off"`，停下来才 `polite`
  - 过渡走 Vue 原生 `<Transition>` / React `MTransition`，同一套 `m-carousel-slide-*` 类名，翻页方向由根上的 `--m-carousel-dir` 决定
  
  新增 MAnchor 锚点导航。
  
  - `items` 必填（`href` / `title` / `children`），children 缩进一级；`<nav>` + `<a>`，激活项 `aria-current="true"`
  - `v-model:current` / React `current` + `onCurrentChange` + `defaultCurrent`，值是激活的 href；`change` 报激活变化，`click` 报点击（默认跳转已拦下）
  - `container` 支持选择器、元素、返回元素的函数，默认整页；`offset` 是激活判定的顶部偏移，激活项 = 最后一个顶边越过它的锚点，容器滚到底时激活最后一个
  - 点击滚到目标（`targetOffset` 定距顶距离，默认等于 offset；`smooth` 平滑，减弱动效时瞬时），滚动途中锁住判定不让激活项来回跳；`updateHash` 才写地址栏
  - `affix` 吸顶（sticky，top 取 offset）；`direction="horizontal"` 横排；`item` 插槽 / `renderItem` 自定义每条并拿到 active
  - 指示线随激活项滑动，水墨层换成按实际长度生成的笔触线（`seed` 定笔触）；监听、判定、滚动、测量都在 core 的 `createAnchor` 控制器里

- [`8287c2b`](https://github.com/shuimo-design/shuimo-ui-next/commit/8287c2b8b619b67fe590d5482581feea2cfdbd51) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MReadingStroke 一笔书进度：阅读进度 = 随页面滚动写完的一根笔触，固定在视口顶部（或底部）。
  
  - 状态由 core 控制器 `createReadingStroke` 持有：目标解析（选择器 / 元素 / 函数，默认整页）、滚动和 resize 监听、进度换算；服务端快照恒为 0
  - 笔触用 `brushLineUrl` 按视口实际宽度（64px 分桶）生成当遮罩，进度用 clip-path 从左往右揭开；支持 `mask-composite` 的浏览器再叠一层横向渐变让笔尖化开，不支持的直接按进度截宽
  - 没有墨迹引擎时是一条实墨；`role="progressbar"` + `aria-valuenow`（整数百分点）
  - `change` 事件只在跨过整数百分点时触发；`seed` / `position` / `target` / `thickness` / `color` / `zIndex`

- [`6098b47`](https://github.com/shuimo-design/shuimo-ui-next/commit/6098b47b9face9114df8a7b4d03a160bd7f825c5) Thanks [@JobinJia](https://github.com/JobinJia)! - MRicePaper 的远山重做：照旧站 shuimo-ui 0.3 那套手绘远山的结构生成。
  
  - 左右各一组、一组四层（base / mid / front / front2），最高的山在最后面，前景两座矮、深、清楚；山脊是连绵的钝三角，坡线上有褶皱，云雾盖在山上
  - 山脊的墨线是真笔触：从旧站手绘 webp 里抠出来的矢量墨线（`ink/assets/mountain-brushes.ts`），一段段弯到生成的山脊上
  - 新增 `inkMountainScene`（`@shuimo-design/core/ink`）：每层四张 alpha 遮罩（剪影 / 山体 / 墨线 / 云雾），颜色由 CSS 变量上
  - 新增 CSS 变量 `--m-rice-paper-landscape-wash`（山体青绿）、`--m-rice-paper-landscape-front`（前景两座）；`--m-rice-paper-landscape-opacity` 默认从 0.55 改为 0.45
  - 远山的图只在挂载后才生成（八层图约 550 KB，不进服务端 HTML；它们本来要等 ready 才淡入）
  - DOM：`.m-rice-paper__ridge` 从 4 个变 8 个，里面多了 `.m-rice-paper__ridge-wash` / `.m-rice-paper__ridge-line` 两个子元素，修饰类多了 `--base/--mid/--front/--front2` 和 `--wash/--ink`

- [`6f52ccc`](https://github.com/shuimo-design/shuimo-ui-next/commit/6f52ccca223f80b277741cf5299fead8ef717a51) Thanks [@JobinJia](https://github.com/JobinJia)! - MTable 补列排序与行选择。
  
  - 列上 `sortable: true` 按 `row[prop]` 用默认比较（数字按数值、字符串 localeCompare、空值排最后），也可以给比较函数；`MTableColumn` 同步加 `sortable`
  - 表头点一下升序、再点降序、第三下取消；可排序列的表头是真按钮，键盘可达，`aria-sort` 标在 `<th>` 上；指示器两枚小三角，水墨层把点亮的那枚换成墨点
  - `v-model:sort` / React `sort` + `onSortChange` + `defaultSort`，`sortChange` 事件；`sortRemote` 时不在本地排只发事件，给服务端排序用
  - 排序纯函数 `sortTableRows` 在 core，返回带原下标的行，按下标算的 rowKey 排序后不变
  - `selection="multiple" | "single"` 在第一列插入 MCheckbox；表头全选 / 半选只算 `selectable` 为 true 的行；点行不改选中态，只有点勾选框才改
  - `v-model:selectedKeys` / React `selectedKeys` + `onSelectedKeysChange` + `defaultSelectedKeys`，按 `rowKey` 记；`selectionChange` / `select` / `selectAll` 事件
  - 选中行加 `m-table__row--selected` 和 `aria-selected`，水墨层铺一层淡墨；选择状态的纯函数 `tableSelectionState` / `toggleTableSelection` / `toggleAllTableSelection` 在 core
  - 新增内部图标 `caret-up`、`caret-down`

- [`268d4cb`](https://github.com/shuimo-design/shuimo-ui-next/commit/268d4cbf22d06e5bb8f25a5f00a2a063d7f99a7e) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MUpload 上传。
  
  - `v-model:fileList` / React `fileList` + `onFileListChange` + `defaultFileList`；每项是 `{ uid, name, size, type, status, percent, raw, response, error, url }`，uid 由壳层的 `useId` 前缀派生
  - `action` / `method` / `headers` / `data` / `name` / `withCredentials` 走内置的 XMLHttpRequest（core 的 `upload/request.ts`），`customRequest` 整个换掉；不给地址也没自定义请求时只选文件，状态停在 `ready`
  - `multiple` / `accept` / `directory` / `limit` / `maxSize` / `beforeUpload`（返回 false 跳过、返回 File 替换）/ `autoUpload`（关掉后 `submit()` 手动传）；`abort()` 中断、`clearFiles(status?)` 清空
  - `drag` 拖拽区：`role="button"` + 回车 / 空格打开选择框，`dragenter / dragover / drop` 的判定在 core；水墨层是一张毛边纸，拖入时中心晕开一团淡墨
  - 默认触发钮是 MButton，`tip` 插槽 / `renderTip` 由 `aria-describedby` 指向；文件列表借 MList 的骨架，传输中的行是 MProgress，`file` 插槽 / `renderFile` 自定义每一行；删除钮带 `aria-label`
  - 事件：`change` / `progress` / `success` / `error` / `remove` / `exceed` / `preview`；列表变化会通知外层 MFormItem 校验
  - React 的 MButton 多了 `aria-describedby` 透传

- [`44d0d60`](https://github.com/shuimo-design/shuimo-ui-next/commit/44d0d600d029857be3c736da0d28226109a6a2d2) Thanks [@JobinJia](https://github.com/JobinJia)! - 新增 MWatermark 水印。
  
  - `content` 文字（数组多行）或 `image` 图片；`font` 调字号 / 字体 / 字重 / 墨色，`rotate`（默认 -22）、`gap`、`offset`、`width` / `height`、`zIndex`（默认 9）
  - 平铺图是 core 纯函数 `watermarkSvg` / `watermarkStyle` 拼出的 SVG data URL，不量 DOM、不用 canvas，服务端也能出
  - 文字画成遮罩、墨色走 `--m-watermark-color`（默认淡墨，跟随深浅主题）；`ink`（默认开）在水墨皮下换成带 `seed` 晕染的那张
  - 防篡改：core 的 `createWatermark` 用 MutationObserver 盯水印层，被删、被改样式 / 属性就贴回去
  
  新增 MAutoComplete 自动完成。
  
  - `v-model` / `value` 就是输入框里的文字；`options` 是 `{ value, label?, disabled? }`，选中后把 value 写回
  - `filter` 默认前缀匹配、不分大小写（value 或 label 对上都算），传函数自定义，`false` 交给调用方按 `search` 事件筛好再传；`debounce` 给 search 防抖
  - 上下键移动高亮（跳过禁用项）、Enter 选中、Esc / Tab 收起、再输入重新弹；`emptyText` 给了才在无匹配时弹那行字
  - `role="combobox"` + `aria-expanded` / `aria-controls` / `aria-activedescendant`，列表 `role="listbox"` / `option`
  - `select` / `search` / `focus` / `blur` / `clear` 事件；`option`（`{ option, active }`）/ `prefix` / `suffix` 插槽，React 是 `renderOption` / `prefix` / `suffix`；暴露 `focus()` / `blur()`
  - 弹层复用 MPopper（`placement` / `teleport`），边框笔触种子由 `seed` 给；开合、高亮、防抖都在 core 的 `createAutoComplete`

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

## 1.0.0-beta.2

### Minor Changes

- [`783b326`](https://github.com/shuimo-design/shuimo-ui-next/commit/783b326fc90860cb0a8a900c9995d08ab7883558) Thanks [@JobinJia](https://github.com/JobinJia)! - 样式可以按需引入了。`style.css` 仍是整份；不想全引就按组件引 `style/<组件名>` 入口（`@shuimo-design/vue/style/MButton`、`@shuimo-design/react/style/MButton`），一个入口把底子（`css/base.css`）、它内部渲染的组件和它自己的 css 一起带齐，重复引到的文件由打包器按模块去重。散件本身暴露在 `css/<名字>.css`。

  - Vue：`ShuimoResolver({ importStyle: true })` 配合 unplugin-vue-components，模板里写 `<MButton>` 就连样式一起自动引。
  - React：配 vite-plugin-imp 照 import 名单补样式；babel-plugin-import 在 Vite 里看不见 JSX，不适用。
  - core：`@shuimo-design/core/styles` 导出清单（`COMPONENT_STYLES`、`styleFilesOf`），两个壳的入口和 resolver 都从这里算。

  按需时不要再引 `style.css`，会重。Nuxt 模块仍是全量。

## 1.0.0-beta.1

### Minor Changes

- MRadio / MRadioGroup / MCheckboxGroup / MCollapse / MSlider / MSelect 的 v-model（React 的 value / onValueChange）类型改成泛型，跟着绑定的值和形状属性走：

  - 单选组、复选组：绑 `ref("a")` / `ref<string[]>` 就推成 string，不再是 `string | number | boolean` 的宽联合
  - 折叠面板：写了 `accordion` 就是单个 name（全收起为 undefined），否则是数组
  - 滑块：写了 `range` 就是 `[起, 止]`，否则是一个数
  - 下拉：写了 `multiple` 就是数组，否则是"值 | undefined"（清空后为 undefined）

  对不上的用法（`range` 却绑一个数、`multiple` 却绑单值）现在是类型错误。以前把状态声明成 `SliderValue` / `CollapseModel` 这类并集的代码要改成精确类型（示例站已改）。文档里 v-model 的类型按不带参数的形状显示，和以前一致。

- MSwitch 的值类型改成泛型：不传 activeValue 时 v-model / value 就是 boolean，传了 `activeValue="night"` 就推成 string。之前是 `string | number | boolean` 的宽联合，Vue 开 strictTemplates 后 `v-model="ref(true)"` 会报类型错，React 侧 `onValueChange={setOn}` 也得手动收窄。

## 1.0.0-beta.0

### Major Changes

- 首个公开预发布版本。同一套核心，Vue 3 和 React 各一层薄壳，48 个组件两边都有。

  宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG，包里没有位图也没有字体。

  - `@shuimo-design/core` —— 无框架内核：状态控制器、几何与墨迹生成、全部样式。两个壳都依赖它，不用单独安装。
  - `@shuimo-design/vue` —— Vue 3 壳，另有 `./nuxt`（Nuxt 模块）和 `./resolver`（配合 unplugin-vue-components 自动引入）。
  - `@shuimo-design/react` —— React 壳，`v-model` 对应受控 / 非受控两套 prop，具名插槽对应渲染属性。

  样式是单独一份，必须显式 `import "@shuimo-design/vue/style.css"`；水墨皮肤在 `@layer m.ink` 里，由 `createInkEngine()` 打开，不调用就只有基础层。两边都支持服务端渲染，弹层类组件不进服务端 HTML。纯 ESM。
