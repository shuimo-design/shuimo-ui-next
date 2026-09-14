import { isStyledComponent, STYLE_BASE } from "@shuimo-design/core/styles";

/**
 * 给 unplugin-vue-components 用：ShuimoResolver() 按需引入 M* 组件。
 *
 * ```ts
 * Components({ resolvers: [ShuimoResolver({ importStyle: true })] })
 * ```
 */
export interface ShuimoResolverOptions {
  /**
   * 顺手把组件的样式也按需引进来（`@shuimo-design/vue/style/<组件名>`，
   * 里面是 base + 它依赖的组件 + 它自己的 css）。
   * 开了这个就不要再全量 `import "@shuimo-design/vue/style.css"`，两份会重。
   * 默认关：不引样式，由你自己全量引一次。
   */
  importStyle?: boolean;
}

export interface ComponentResolverResult {
  name: string;
  from: string;
  /** unplugin-vue-components 会把它作为副作用 import 一起写进去 */
  sideEffects?: string;
}

export function ShuimoResolver(options: ShuimoResolverOptions = {}) {
  const { importStyle = false } = options;
  return {
    type: "component" as const,
    resolve(name: string): ComponentResolverResult | undefined {
      if (!/^M[A-Z]/.test(name)) return undefined;
      const result: ComponentResolverResult = { name, from: "@shuimo-design/vue" };
      if (importStyle) {
        // 不在清单里的名字（MIconClose 这类图标）样式都在 base 里，引 base 就够
        const entry = isStyledComponent(name) ? name : STYLE_BASE;
        result.sideEffects = `@shuimo-design/vue/style/${entry}`;
      }
      return result;
    },
  };
}
