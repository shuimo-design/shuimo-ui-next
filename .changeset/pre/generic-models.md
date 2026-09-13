---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

MRadio / MRadioGroup / MCheckboxGroup / MCollapse / MSlider / MSelect 的 v-model（React 的 value / onValueChange）类型改成泛型，跟着绑定的值和形状属性走：

- 单选组、复选组：绑 `ref("a")` / `ref<string[]>` 就推成 string，不再是 `string | number | boolean` 的宽联合
- 折叠面板：写了 `accordion` 就是单个 name（全收起为 undefined），否则是数组
- 滑块：写了 `range` 就是 `[起, 止]`，否则是一个数
- 下拉：写了 `multiple` 就是数组，否则是"值 | undefined"（清空后为 undefined）

对不上的用法（`range` 却绑一个数、`multiple` 却绑单值）现在是类型错误。以前把状态声明成 `SliderValue` / `CollapseModel` 这类并集的代码要改成精确类型（示例站已改）。文档里 v-model 的类型按不带参数的形状显示，和以前一致。
