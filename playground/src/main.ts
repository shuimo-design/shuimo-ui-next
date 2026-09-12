import { createApp } from "vue";
// 样式全在 core（JS 里不带，使用方必须显式引一次）。
// 这里引 core 而不是 @shuimo-design/vue/style.css：那份是构建时复制过去的副本，
// 只有 dist 里才有；引 core 的话开发时直接吃源码清单，不用先构建。
import "@shuimo-design/core/style.css";
import "./demo.css";
import { createShuimo } from "@shuimo-design/vue";
import { createInkEngine } from "@shuimo-design/core/ink";
import App from "./App.vue";

createInkEngine();
createApp(App).use(createShuimo()).mount("#app");
