/**
 * 构建后校验：src 里每一个 .css 的第一条类选择器都必须出现在 dist/style.css 里。
 * 背景：package.json 的 sideEffects 只声明了 CSS 时，rolldown 会跳过纯转发的 barrel
 * 文件，连带丢掉那里的 `import "./x.css"`，产物里就少了整块组件样式（2026-09-08 实测）。
 */
import { globSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundled = readFileSync(resolve(root, "dist/style.css"), "utf8");
const files = globSync("src/**/*.css", { cwd: root }).sort();

const missing: string[] = [];
for (const file of files) {
  const source = readFileSync(resolve(root, file), "utf8");
  // 第一个类名，例如 `.m-button` / `[data-ink-stroke]` 这类没有类名的文件用属性选择器兜底
  const probe = /\.([a-z][\w-]*)/.exec(source)?.[1] ?? /\[([a-z][\w-]*)/.exec(source)?.[1];
  if (!probe) continue;
  if (!bundled.includes(probe)) missing.push(`${relative(root, resolve(root, file))} (.${probe})`);
}

if (missing.length > 0) {
  console.error("dist/style.css is missing styles from:\n  " + missing.join("\n  "));
  process.exit(1);
}
console.log(`style check passed: ${files.length} css files present in dist/style.css`);
