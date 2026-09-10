import { createApp } from "vue";
// 打包产物把所有 CSS 抽成独立的 style.css，JS 里不再带样式，使用方必须显式引入
import "@shuimo-design/ui/style.css";
import "./demo.css";
import { createShuimo } from "@shuimo-design/ui";
import { createInkEngine } from "@shuimo-design/ui/ink";
import App from "./App.vue";

createInkEngine();
createApp(App).use(createShuimo()).mount("#app");
