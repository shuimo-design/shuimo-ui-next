---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

新增 MSealColophon 落款：页脚 / 作品末尾的署名块，落款语 + 署名 + 日期，末字右下压一枚印章。

- `author` 必填；`text` 落款语、`date` 原样显示；印文 `seal` 默认取署名前两个字，`sealShape` / `sealMode` / `sealSize` 递给 MStamp
- `align` 靠左 / 靠右（默认右），`vertical` 竖排（writing-mode: vertical-rl，印章落在末字下面）
- 默认插槽替换整段落款文，`seal` 插槽替换印章（React：`children` / `renderSeal`）
- 落款文用 `--m-font-brush` 字体栈、淡墨、行距略大；印章种子默认固定，服务端和客户端盖的是同一枚；开了墨迹引擎时印泥略透、章略歪
