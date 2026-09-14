/**
 * 样式守卫。
 *
 * 背景：rolldown 会把"只做转发、没有副作用"的模块整个跳过，样式被静默丢掉过一次
 * （2026-09-08 实测）。这次干脆不给它犯错的机会：全库只有 src/styles/index.css 一个入口，
 * 所有样式在那里显式列出。于是守卫要防的变成"新加了 css 但忘了往清单里加一行"。
 *
 * 第 3 条是 SSR 的硬约束：纯 Node 跑服务端渲染时框架包是 external 的，
 * Node 会真的去 import 那个 .css 然后崩。所以组件代码一行 css import 都不能有。
 */
import { existsSync, globSync, readFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPONENT_STYLES,
  isStyledComponent,
  SHARED_STYLES,
  STYLE_BASE,
  styleFilesOf,
} from "../src/styles/manifest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "src/styles/index.css");
const manifest = readFileSync(manifestPath, "utf8");

const imported = new Set(
  [...manifest.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) =>
    resolve(dirname(manifestPath), m[1]!),
  ),
);

const fail = (message: string) => {
  console.error(`style check failed: ${message}`);
  process.exitCode = 1;
};

// ① 每个 css 文件都必须在清单里
const all = globSync("src/**/*.css", { cwd: root })
  .map((f) => resolve(root, f))
  .filter((f) => f !== manifestPath);
const missing = all.filter((f) => !imported.has(f));
if (missing.length > 0) {
  fail(
    `这些样式没有登记进 src/styles/index.css：\n  ${missing.map((f) => relative(root, f)).join("\n  ")}`,
  );
}

// ② 清单里不能有死链
const dangling = [...imported].filter((f) => !existsSync(f));
if (dangling.length > 0) {
  fail(
    `src/styles/index.css 里这些 @import 指向不存在的文件：\n  ${dangling.map((f) => relative(root, f)).join("\n  ")}`,
  );
}

// ③ 任何 ts 都不许 import css
const offenders = globSync("src/**/*.ts", { cwd: root }).filter((f) =>
  /import\s+["'][^"']+\.css["']/.test(readFileSync(resolve(root, f), "utf8")),
);
const allowed = new Set(["src/index.ts"]);
const bad = offenders.filter((f) => !allowed.has(f.replaceAll("\\", "/")));
if (bad.length > 0) {
  fail(
    `这些文件 import 了 css，会让纯 Node 的服务端渲染崩掉；样式只能从 src/styles/index.css 进：\n  ${bad.join("\n  ")}`,
  );
}

// ④ 产物兜底：每个 css 的第一条类选择器都要出现在 dist/style.css 里
const bundlePath = resolve(root, "dist/style.css");
if (existsSync(bundlePath)) {
  const bundle = readFileSync(bundlePath, "utf8");
  for (const file of all) {
    const source = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*@[\w-]+[^{;]*;/gm, "");
    const probe = source.match(/\.[\w-]+/)?.[0] ?? source.match(/\[[\w-]+/)?.[0];
    if (probe && !bundle.includes(probe)) {
      fail(`dist/style.css 里找不到 ${relative(root, file)} 的 ${probe}`);
    }
  }
}

// ⑤ 按需清单（src/styles/manifest.ts）和源文件对得上：
//    表里写的每个名字都有文件，组件目录和 internal 下的每个文件都被某个组件用到，
//    renders 里写的要么是组件名要么是共享块
const splittable = new Map(
  all
    .filter((f) => /\/src\/(components|internal)\//.test(f.replaceAll("\\", "/")))
    .map((f) => [basename(f, ".css"), f] as const),
);
const referenced = new Set<string>();
for (const [name, entry] of Object.entries(COMPONENT_STYLES)) {
  const css = "css" in entry ? entry.css : undefined;
  if (css !== undefined) {
    if (!splittable.has(css)) fail(`manifest 里 ${name} 的样式 ${css}.css 不存在`);
    referenced.add(css);
  }
  const renders: readonly string[] = "renders" in entry ? entry.renders : [];
  for (const dep of renders) {
    if (isStyledComponent(dep)) continue;
    if ((SHARED_STYLES as readonly string[]).includes(dep)) continue;
    fail(`manifest 里 ${name} 的 renders 写了 ${dep}，既不是组件也不是共享块`);
  }
  for (const file of styleFilesOf(name as keyof typeof COMPONENT_STYLES)) referenced.add(file);
}
for (const shared of SHARED_STYLES) {
  if (!splittable.has(shared)) fail(`manifest 的 SHARED_STYLES 里 ${shared}.css 不存在`);
}
const orphan = [...splittable.keys()].filter((n) => !referenced.has(n));
if (orphan.length > 0) {
  fail(
    `这些样式没有任何组件用到，按需引入时永远引不到，请登记进 src/styles/manifest.ts：${orphan.join(", ")}`,
  );
}

// ⑥ 产物兜底：dist/css 里每个组件都能凑齐它要的文件
const splitDir = resolve(root, "dist/css");
if (existsSync(splitDir)) {
  const need = new Set<string>([STYLE_BASE, ...splittable.keys()]);
  for (const file of need) {
    if (!existsSync(resolve(splitDir, `${file}.css`))) fail(`dist/css/${file}.css 没有产出`);
  }
  const base = readFileSync(resolve(splitDir, `${STYLE_BASE}.css`), "utf8");
  if (!base.startsWith("@layer m.reset, m.tokens, m.base, m.component, m.ink;")) {
    fail("dist/css/base.css 没有以层顺序声明开头");
  }
}

if (process.exitCode !== 1) {
  console.log(
    `style check passed: ${all.length} css files listed and bundled, ${splittable.size} split for on-demand use`,
  );
}
