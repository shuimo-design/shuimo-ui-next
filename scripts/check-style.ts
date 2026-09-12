/**
 * 守住 CSS 那条线的机检。四条断言，CI 必过。
 *
 * 1. core 里除根入口 index.ts 外，任何 .ts 都不许 import .css —— 纯 Node 跑服务端渲染时
 *    框架包是 external 的，Node 会真的去 import 那个 .css 然后崩。
 * 2. `styles/index.css` 这份清单里不许有死链 —— 组件重命名 / 删除时最容易留下。
 * 3. core 里的每个 .css 都必须在清单里 —— 漏一行就是样式静默丢失，页面看着"少了点什么"
 *    但一句报错都没有，最难查。
 * 4. 两个壳包里一个 .css 都不许有 —— 样式只此一份，在 core。
 */
import { globSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failed = false;
const fail = (message: string) => {
  console.error(`✗ ${message}`);
  failed = true;
};

/* ── 1. core 的 .ts 不许 import css ───────────────────────────── */
// 唯一的例外：根入口那一行 `import "./styles/index.css"`，它就是给打包器认样式的那个钩子
const STYLE_ENTRY = "packages/core/src/index.ts";
for (const file of globSync("packages/core/src/**/*.ts", { cwd: root })) {
  if (file === STYLE_ENTRY) continue;
  const source = readFileSync(resolve(root, file), "utf8");
  for (const match of source.matchAll(/(?:from|import)\s+["']([^"']+\.css)["']/g)) {
    fail(`core 的 .ts 引了样式（服务端渲染会崩）：${file} → ${match[1]}`);
  }
}

/* ── 2 & 3. 清单与实际文件必须一一对上 ────────────────────────── */
const manifestPath = "packages/core/src/styles/index.css";
const manifestDir = resolve(root, dirname(manifestPath));
const manifest = readFileSync(resolve(root, manifestPath), "utf8");

const listed = new Set<string>();
for (const match of manifest.matchAll(/@import\s+["']([^"']+)["']/g)) {
  const target = resolve(manifestDir, match[1]!);
  listed.add(relative(root, target));
  try {
    readFileSync(target);
  } catch {
    fail(`样式清单里是死链：${manifestPath} → ${match[1]}`);
  }
}

for (const file of globSync("packages/core/src/**/*.css", { cwd: root })) {
  if (file === manifestPath) continue;
  if (!listed.has(file)) fail(`这份样式没进清单，打包时会被漏掉：${file}`);
}

/* ── 4. 壳包里没有样式 ────────────────────────────────────────── */
for (const pkg of ["vue", "react"]) {
  for (const file of globSync(`packages/${pkg}/src/**/*.css`, { cwd: root })) {
    fail(`样式只该在 core 里，这份在壳包：${file}`);
  }
}

console.log(
  failed ? "style check failed" : `style check passed：${listed.size} 份样式全部在清单里`,
);
process.exit(failed ? 1 : 0);
