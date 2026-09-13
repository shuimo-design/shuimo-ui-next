# @shuimo-design/core

## 1.0.0-beta.0

### Major Changes

- 首个公开预发布版本。同一套核心，Vue 3 和 React 各一层薄壳，48 个组件两边都有。

  宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG，包里没有位图也没有字体。

  - `@shuimo-design/core` —— 无框架内核：状态控制器、几何与墨迹生成、全部样式。两个壳都依赖它，不用单独安装。
  - `@shuimo-design/vue` —— Vue 3 壳，另有 `./nuxt`（Nuxt 模块）和 `./resolver`（配合 unplugin-vue-components 自动引入）。
  - `@shuimo-design/react` —— React 壳，`v-model` 对应受控 / 非受控两套 prop，具名插槽对应渲染属性。

  样式是单独一份，必须显式 `import "@shuimo-design/vue/style.css"`；水墨皮肤在 `@layer m.ink` 里，由 `createInkEngine()` 打开，不调用就只有基础层。两边都支持服务端渲染，弹层类组件不进服务端 HTML。纯 ESM。
