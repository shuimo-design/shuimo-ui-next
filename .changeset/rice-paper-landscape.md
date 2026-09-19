---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

MRicePaper 的远山重做：照旧站 shuimo-ui 0.3 那套手绘远山的结构生成。

- 左右各一组、一组四层（base / mid / front / front2），最高的山在最后面，前景两座矮、深、清楚；山脊是连绵的钝三角，坡线上有褶皱，云雾盖在山上
- 山脊的墨线是真笔触：从旧站手绘 webp 里抠出来的矢量墨线（`ink/assets/mountain-brushes.ts`），一段段弯到生成的山脊上
- 新增 `inkMountainScene`（`@shuimo-design/core/ink`）：每层四张 alpha 遮罩（剪影 / 山体 / 墨线 / 云雾），颜色由 CSS 变量上
- 新增 CSS 变量 `--m-rice-paper-landscape-wash`（山体青绿）、`--m-rice-paper-landscape-front`（前景两座）；`--m-rice-paper-landscape-opacity` 默认从 0.55 改为 0.32
- 远山的图只在挂载后才生成（八层图约 550 KB，不进服务端 HTML；它们本来要等 ready 才淡入）
- DOM：`.m-rice-paper__ridge` 从 4 个变 8 个，里面多了 `.m-rice-paper__ridge-wash` / `.m-rice-paper__ridge-line` 两个子元素，修饰类多了 `--base/--mid/--front/--front2` 和 `--wash/--ink`
