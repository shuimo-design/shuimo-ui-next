/**
 * 样式全在 @shuimo-design/core，这个包只是把它的产物搬过来，用户装一个包就能用：
 *
 * - dist/style.css      全量，构建时由 vite.config.ts 的 pack.copy 复制；这里只断言两份字节一致
 * - dist/css/*.css      按需的散件，这里从 core 复制
 * - dist/style/<组件>.js  按需入口：一个组件要哪几份 css 由 core 的清单算出来，这里生成成
 *                        纯副作用的 import 列表。用户（或 resolver / babel-plugin-import）
 *                        `import "@shuimo-design/vue/style/MButton"` 就把 base + 依赖 + 自己引齐，
 *                        重复引到的文件由打包器按模块去重。
 *
 * 复制失败、有人手改、或者 core 没先构建，都会在这里被拦住。
 */
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENT_STYLES, STYLE_BASE, styleFilesOf } from "@shuimo-design/core/styles";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = resolve(root, "../core/dist");

for (const file of ["style.css", "css/base.css"]) {
  if (!existsSync(resolve(core, file))) {
    console.error(`style check failed: 找不到 ${resolve(core, file)}（core 要先构建）`);
    process.exit(1);
  }
}

const digest = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
if (digest(resolve(root, "dist/style.css")) !== digest(resolve(core, "style.css"))) {
  console.error("style check failed: dist/style.css 和 @shuimo-design/core 的产物不一致");
  process.exit(1);
}

// 散件：整个目录照搬
const cssDir = resolve(root, "dist/css");
rmSync(cssDir, { recursive: true, force: true });
cpSync(resolve(core, "css"), cssDir, { recursive: true });
const shipped = new Set(readdirSync(cssDir).map((f) => f.replace(/\.css$/, "")));

// 按需入口：每个组件一个 js，只有 import 没有导出
const entryDir = resolve(root, "dist/style");
rmSync(entryDir, { recursive: true, force: true });
mkdirSync(entryDir, { recursive: true });
// 只用图标、或者想手动分步引的人：base 单独也是一个入口
writeFileSync(resolve(entryDir, `${STYLE_BASE}.js`), `import "../css/${STYLE_BASE}.css";\n`);
let entries = 1;
for (const name of Object.keys(COMPONENT_STYLES) as (keyof typeof COMPONENT_STYLES)[]) {
  const files = styleFilesOf(name);
  const missing = files.filter((f) => !shipped.has(f));
  if (missing.length > 0) {
    console.error(
      `style check failed: ${name} 要的 ${missing.join(", ")} 不在 core 的 dist/css 里`,
    );
    process.exit(1);
  }
  const lines = files.map((f) => `import "../css/${f}.css";`);
  writeFileSync(resolve(entryDir, `${name}.js`), `${lines.join("\n")}\n`);
  entries++;
}

console.log(
  `style check passed: dist/style.css 与 @shuimo-design/core 一致，${shipped.size} 份散件，${entries} 个按需入口`,
);
