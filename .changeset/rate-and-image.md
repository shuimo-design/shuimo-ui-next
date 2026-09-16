---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MRate 评分。

- `v-model` 是 0 ~ count 的数，`allowHalf` 时可为 .5；`allowClear`（默认开）再点当前值归零
- 每格一枚墨点，水墨层换成按 `seed` + 下标派生的毛边墨团，同一组里每格略不同；`character` 插槽 / `renderCharacter` 自定义每一格
- `role="radiogroup"` + 每格 `role="radio"`，整组只有一个 Tab 停靠点；方向键增减一档（半格时半档）、Home 归零、End 满分
- `texts` 显示每档文字，悬停预览时跟着预览值变；`hoverChange` 报预览值，离开为 0
- `readonly` 只展示、`disabled` 退出 Tab 序列；悬停 / 落值 / 键盘调值都在 core 的 `createRate` 控制器里
