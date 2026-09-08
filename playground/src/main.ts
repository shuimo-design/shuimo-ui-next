import { createApp } from "vue";
import { createShuimo } from "@shuimo-design/ui";
import { createInkEngine } from "@shuimo-design/ui/ink";
import App from "./App.vue";

createInkEngine();
createApp(App).use(createShuimo()).mount("#app");
