/**
 * 守住"不重复实现"这条线的机检。三条断言，CI 必过。
 *
 * 1. core 里不许出现任何框架 —— 它是两个壳共用的地基，沾上一点就不共用了。
 * 2. 已经迁完的组件，壳里不许碰 DOM、定时器、观察器，也不许做算术 ——
 *    这是"逻辑必须在 core"的正面表述。想违反的地方，说明那段逻辑该下沉。
 * 3. 两个壳的导出必须对得上（以已迁完的为准），顺便报一下迁移进度。
 *
 * 第 2、3 条只作用在"两边都有"的组件上，所以迁移过程中它会跟着自动收紧，
 * 不需要维护一张手工的豁免名单。
 */
import { globSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failed = false;
const fail = (message: string) => {
  console.error(`✗ ${message}`);
  failed = true;
};

/* ── 1. core 不许沾框架 ───────────────────────────────────────── */
const FRAMEWORK = /^(vue|react|react-dom|preact|@vue\/|@vueuse\/|@floating-ui\/(vue|react)|next)/;
const coreFiles = globSync("packages/core/src/**/*.{ts,tsx,vue}", { cwd: root });
for (const file of coreFiles) {
  if (/\.(vue|tsx)$/.test(file)) {
    fail(`core 里不该有框架组件文件：${file}`);
    continue;
  }
  const source = readFileSync(resolve(root, file), "utf8");
  for (const match of source.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
    if (FRAMEWORK.test(match[1]!)) fail(`core 引了框架：${file} → ${match[1]}`);
  }
}

/* ── 2. 壳要薄 ────────────────────────────────────────────────── */
/** 壳里不许出现的东西：一出现就说明有逻辑没下沉到 core */
const FORBIDDEN = [
  "document.",
  "window.",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "addEventListener",
  "ResizeObserver",
  "MutationObserver",
  "IntersectionObserver",
  "getBoundingClientRect",
  "getComputedStyle",
  "compareDocumentPosition",
  "localStorage",
  "matchMedia",
  "Math.",
];

const dirs = (pkg: string) =>
  new Set(
    globSync(`packages/${pkg}/src/components/*/`, { cwd: root }).map((p) =>
      basename(p.replace(/\/$/, "")),
    ),
  );
const vueDirs = dirs("vue");
const reactDirs = dirs("react");
/** 两边都有的才算迁完，才受第 2、3 条约束 */
const migrated = [...reactDirs].filter((d) => vueDirs.has(d)).sort();

for (const dir of migrated) {
  for (const pkg of ["vue", "react"]) {
    for (const file of globSync(`packages/${pkg}/src/components/${dir}/*.{ts,tsx,vue}`, {
      cwd: root,
    })) {
      if (/\.test\.tsx?$/.test(file)) continue;
      const source = readFileSync(resolve(root, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*(\/\/|\s*\*).*$/gm, "");
      for (const token of FORBIDDEN) {
        if (source.includes(token)) {
          fail(`壳里不该出现 ${token}（这段逻辑该在 core 里）：${file}`);
        }
      }
    }
  }
}

/* ── 3. 两个壳的组件对得上 ────────────────────────────────────── */
const onlyReact = [...reactDirs].filter((d) => !vueDirs.has(d));
if (onlyReact.length > 0) fail(`这些组件只有 React 有，Vue 没有：${onlyReact.join(", ")}`);

const pending = [...vueDirs].filter((d) => !reactDirs.has(d)).sort();
console.log(
  failed
    ? "architecture check failed"
    : `architecture check passed：core 零框架依赖；已双端落地 ${migrated.length}/${vueDirs.size} 个组件`,
);
if (pending.length > 0 && !failed) {
  console.log(`还没搬到 React 的（${pending.length} 个）：${pending.join(", ")}`);
}
process.exit(failed ? 1 : 0);
