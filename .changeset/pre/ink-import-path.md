---
"@shuimo-design/vue": patch
"@shuimo-design/react": patch
---

README 里墨迹引擎的引入路径改成本包的 `/ink` 子路径。原来写的 `@shuimo-design/core/ink` 在 pnpm 项目里解析不到：core 只是本包的依赖，不是用户项目的直接依赖。
