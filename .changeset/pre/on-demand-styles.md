---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

样式可以按需引入了。`style.css` 仍是整份；不想全引就按组件引 `style/<组件名>` 入口（`@shuimo-design/vue/style/MButton`、`@shuimo-design/react/style/MButton`），一个入口把底子（`css/base.css`）、它内部渲染的组件和它自己的 css 一起带齐，重复引到的文件由打包器按模块去重。散件本身暴露在 `css/<名字>.css`。

- Vue：`ShuimoResolver({ importStyle: true })` 配合 unplugin-vue-components，模板里写 `<MButton>` 就连样式一起自动引。
- React：配 vite-plugin-imp 照 import 名单补样式；babel-plugin-import 在 Vite 里看不见 JSX，不适用。
- core：`@shuimo-design/core/styles` 导出清单（`COMPONENT_STYLES`、`styleFilesOf`），两个壳的入口和 resolver 都从这里算。

按需时不要再引 `style.css`，会重。Nuxt 模块仍是全量。
