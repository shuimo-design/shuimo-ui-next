import { addComponent, defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import { COMPONENT_NAMES } from "./components";

export interface ModuleOptions {
  /** 是否注入全局样式，默认 true */
  css?: boolean;
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@shuimo-design/ui",
    configKey: "shuimo",
    compatibility: { nuxt: ">=4.0.0" },
  },
  defaults: { css: true },
  setup(options, nuxt) {
    if (options.css) nuxt.options.css.push("@shuimo-design/ui/style.css");
    // 显式清单，不再扫 dist 目录
    for (const name of COMPONENT_NAMES) {
      addComponent({ name, export: name, filePath: "@shuimo-design/ui" });
    }
  },
});

export default module;
