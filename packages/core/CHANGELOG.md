# @shuimo-design/core

## 1.0.0-beta.2

### Minor Changes

- [`783b326`](https://github.com/shuimo-design/shuimo-ui-next/commit/783b326fc90860cb0a8a900c9995d08ab7883558) Thanks [@JobinJia](https://github.com/JobinJia)! - 样式可以按需引入了。`style.css` 仍是整份；不想全引就按组件引 `style/<组件名>` 入口（`@shuimo-design/vue/style/MButton`、`@shuimo-design/react/style/MButton`），一个入口把底子（`css/base.css`）、它内部渲染的组件和它自己的 css 一起带齐，重复引到的文件由打包器按模块去重。散件本身暴露在 `css/<名字>.css`。

  - Vue：`ShuimoResolver({ importStyle: true })` 配合 unplugin-vue-components，模板里写 `<MButton>` 就连样式一起自动引。
  - React：配 vite-plugin-imp 照 import 名单补样式；babel-plugin-import 在 Vite 里看不见 JSX，不适用。
  - core：`@shuimo-design/core/styles` 导出清单（`COMPONENT_STYLES`、`styleFilesOf`），两个壳的入口和 resolver 都从这里算。

  按需时不要再引 `style.css`，会重。Nuxt 模块仍是全量。

## 1.0.0-beta.1

### Minor Changes

- MRadio / MRadioGroup / MCheckboxGroup / MCollapse / MSlider / MSelect 的 v-model（React 的 value / onValueChange）类型改成泛型，跟着绑定的值和形状属性走：

  - 单选组、复选组：绑 `ref("a")` / `ref<string[]>` 就推成 string，不再是 `string | number | boolean` 的宽联合
  - 折叠面板：写了 `accordion` 就是单个 name（全收起为 undefined），否则是数组
  - 滑块：写了 `range` 就是 `[起, 止]`，否则是一个数
  - 下拉：写了 `multiple` 就是数组，否则是"值 | undefined"（清空后为 undefined）

  对不上的用法（`range` 却绑一个数、`multiple` 却绑单值）现在是类型错误。以前把状态声明成 `SliderValue` / `CollapseModel` 这类并集的代码要改成精确类型（示例站已改）。文档里 v-model 的类型按不带参数的形状显示，和以前一致。

- MSwitch 的值类型改成泛型：不传 activeValue 时 v-model / value 就是 boolean，传了 `activeValue="night"` 就推成 string。之前是 `string | number | boolean` 的宽联合，Vue 开 strictTemplates 后 `v-model="ref(true)"` 会报类型错，React 侧 `onValueChange={setOn}` 也得手动收窄。

## 1.0.0-beta.0

### Major Changes

- 首个公开预发布版本。同一套核心，Vue 3 和 React 各一层薄壳，48 个组件两边都有。

  宣纸、远山、毛边、笔触、印章全部由代码现算成 SVG，包里没有位图也没有字体。

  - `@shuimo-design/core` —— 无框架内核：状态控制器、几何与墨迹生成、全部样式。两个壳都依赖它，不用单独安装。
  - `@shuimo-design/vue` —— Vue 3 壳，另有 `./nuxt`（Nuxt 模块）和 `./resolver`（配合 unplugin-vue-components 自动引入）。
  - `@shuimo-design/react` —— React 壳，`v-model` 对应受控 / 非受控两套 prop，具名插槽对应渲染属性。

  样式是单独一份，必须显式 `import "@shuimo-design/vue/style.css"`；水墨皮肤在 `@layer m.ink` 里，由 `createInkEngine()` 打开，不调用就只有基础层。两边都支持服务端渲染，弹层类组件不进服务端 HTML。纯 ESM。
