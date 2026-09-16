---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MPaperTheme 宣纸主题：一排纸样，一键切换整站的纸色和纹理。

- 五种预设：raw 生宣、processed 熟宣、antique 古色、teaStained 茶染、moonWhite 月白；`presets` 选要展示的，`labels` 改显示名，`size` 三档
- 切纸就是往 `<html>` 写 `data-paper` 和纸面变量（`--m-paper-rgb` / `--m-paper` / `--m-bg` / `--m-paper-theme-texture`），根元素铺上纸色，开了墨迹引擎再铺纹理；深色主题下只记 `data-paper` 不写变量，转回亮色再补上
- `v-model:preset`（React：`preset` / `onPresetChange` / `defaultPreset`），`change` 事件；默认记到 localStorage（键 `shuimo-paper`），`storage=false` 不记
- `role="radiogroup"`，方向键 / Home / End 切换，服务端首帧不写属性
- core 另导出 `applyPaperPreset()` / `clearPaperPreset()`，不用组件也能切
- MRicePaper 没传 `paper` 时跟随全局的纸：现在也盯着 html 的内联 style 变化重读纸色
