/** 给 unplugin-vue-components 用：ShuimoResolver() 按需引入 M* 组件 */
export interface ComponentResolverResult {
  name: string;
  from: string;
}

export function ShuimoResolver() {
  return {
    type: "component" as const,
    resolve(name: string): ComponentResolverResult | undefined {
      if (/^M[A-Z]/.test(name)) {
        return { name, from: "@shuimo-design/ui" };
      }
      return undefined;
    },
  };
}
