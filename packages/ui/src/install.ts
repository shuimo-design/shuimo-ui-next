import type { App, Component, Plugin } from "vue";
import * as components from "./components";

export interface InstallOptions {
  /** 只注册这些组件（组件名，如 "MButton"） */
  include?: string[];
  /** 排除这些组件 */
  exclude?: string[];
}

function isComponent(value: unknown): value is Component {
  return typeof value === "object" && value !== null && "name" in value;
}

/** 全量注册插件：app.use(createShuimo({ exclude: ["MTable"] })) */
export function createShuimo(options: InstallOptions = {}): Plugin {
  return {
    install(app: App) {
      for (const [name, value] of Object.entries(components)) {
        if (!isComponent(value)) continue;
        if (options.include && !options.include.includes(name)) continue;
        if (options.exclude?.includes(name)) continue;
        app.component(name, value);
      }
    },
  };
}
