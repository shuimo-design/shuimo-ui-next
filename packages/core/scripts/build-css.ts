/**
 * 把样式按组件拆成 dist/css/*.css，供按需引入。
 *
 * 全量的 dist/style.css 由打包器从 src/styles/index.css 出；这里读同一份清单，
 * 按来源分组：components/ 之外的（层顺序、变量、基础重置、图标、墨迹动画）合成 base.css，
 * internal/ 下的共享块和每个组件的 css 各出一个文件，文件名就是 css 的文件名。
 *
 * 不经过打包器：源码已经是浏览器直接能跑的 CSS（嵌套、@layer 都原样发），
 * 打包器对全量那份做的也只是去注释和压缩数值，语义一样。这里只去注释。
 *
 * 每个文件开头都补一行层顺序声明。@layer 的先后由名字第一次出现的顺序决定，
 * 用户要是先引了 button.css 再引 base.css，m.component 就排到了 m.base 前面，
 * 基础样式反过来盖住组件样式。每份文件都自带这一句，引入顺序就不再重要。
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LAYER_ORDER, STYLE_BASE } from "../src/styles/manifest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "src/styles/index.css");
const outDir = resolve(root, "dist/css");

const sources = [...readFileSync(manifestPath, "utf8").matchAll(/@import\s+["']([^"']+)["']/g)].map(
  (m) => resolve(dirname(manifestPath), m[1]!),
);

const stripComments = (css: string) =>
  css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n{3,}/g, "\n\n");

/** 文件属于哪一份产物：base、共享块、还是某个组件 */
const bucketOf = (file: string): string => {
  const rel = relative(resolve(root, "src"), file).replaceAll("\\", "/");
  if (rel.startsWith("components/") || rel.startsWith("internal/")) return basename(file, ".css");
  return STYLE_BASE;
};

const buckets = new Map<string, string[]>();
for (const file of sources) {
  const bucket = bucketOf(file);
  const list = buckets.get(bucket) ?? [];
  list.push(stripComments(readFileSync(file, "utf8")).trim());
  buckets.set(bucket, list);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const [bucket, parts] of buckets) {
  const body = parts.join("\n\n");
  // base 的第一份就是 theme/layers.css，层顺序已经在最前面，不用再补
  const css = body.startsWith("@layer m.reset,") ? body : `${LAYER_ORDER}\n\n${body}`;
  writeFileSync(resolve(outDir, `${bucket}.css`), `${css}\n`);
}

console.log(`css: ${buckets.size} 份按需样式 → dist/css/`);
