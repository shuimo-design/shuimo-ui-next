---
"@shuimo-design/core": minor
"@shuimo-design/vue": minor
"@shuimo-design/react": minor
---

MSwitch 的值类型改成泛型：不传 activeValue 时 v-model / value 就是 boolean，传了 `activeValue="night"` 就推成 string。之前是 `string | number | boolean` 的宽联合，Vue 开 strictTemplates 后 `v-model="ref(true)"` 会报类型错，React 侧 `onValueChange={setOn}` 也得手动收窄。
