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
