---
"@shuimo-design/ui": major
---

首个预发布版本。59 个组件，宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG，包里没有位图和字体。

四个入口：`.` 组件、`./ink` 水墨引擎、`./nuxt` Nuxt 模块、`./resolver` 按需引入。纯 ESM，需要 Vue 3.5+。

水墨皮肤在 `@layer m.ink` 层，由 `createInkEngine()` 打开；不调用就只有基础层样式。
