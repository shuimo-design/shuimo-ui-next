import { createApp } from "vue";
// 样式全在 core（JS 里不带，使用方必须显式引一次）。
// 这里引 core 而不是 @shuimo-design/vue/style.css：那份是构建时复制过去的副本，
// 只有 dist 里才有；引 core 的话开发时直接吃源码清单，不用先构建。
import "@shuimo-design/core/style.css";
import "../shared/site.css";
import "../shared/demo.css";
import { createShuimo } from "@shuimo-design/vue";
import { createInkEngine, preloadStampFont } from "@shuimo-design/core/ink";
import App from "./App.vue";

createInkEngine();
// 示例站自带的篆体（@font-face 在 shared/demo.css 里）先拉下来：
// 印章要量每个字的墨迹框才能排版，字体没到就会先按兜底比例排一版、到了再跳一下
void preloadStampFont();
createApp(App).use(createShuimo()).mount("#app");
