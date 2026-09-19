---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MWatermark 水印。

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
