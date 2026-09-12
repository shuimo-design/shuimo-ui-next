/**
 * 样式全在 @shuimo-design/core，这个包的 dist/style.css 是构建时从 core 的产物复制来的
 * （见 vite.config.ts 的 pack.copy）。这里只断言两份字节一致：
 * 复制失败、有人手改、或者 core 没先构建，都会在这里被拦住。
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mine = resolve(root, "dist/style.css");
const theirs = resolve(root, "../core/dist/style.css");

for (const file of [mine, theirs]) {
  if (!existsSync(file)) {
    console.error(`style check failed: 找不到 ${file}（core 要先构建）`);
    process.exit(1);
  }
}

const digest = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
if (digest(mine) !== digest(theirs)) {
  console.error("style check failed: dist/style.css 和 @shuimo-design/core 的产物不一致");
  process.exit(1);
}

console.log("style check passed: dist/style.css 与 @shuimo-design/core 一致");
