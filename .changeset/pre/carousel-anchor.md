---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MCarousel 走马灯。

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
